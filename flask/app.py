from datetime import timedelta
import os
import calendar
import time
from urllib.request import Request, urlopen
import urllib.parse
import requests
from PIL import Image

from redis import Redis
from flask import Flask, render_template_string, request, session, redirect, url_for
from flask_session import Session


# URL for the U^2-Net instance
REMBG_URL = "http://rembg:5000"
SCREENPOINT_URL = "http://screenpoint:5000/point_screen"

# Path for uploaded photos
UPLOAD_FOLDER = os.path.join('static', 'uploads')


# Create the Flask application
app = Flask(__name__)

# Details on the Secret Key: https://flask.palletsprojects.com/en/1.1.x/config/#SECRET_KEY
# NOTE: The secret key is used to cryptographically-sign the cookies used for storing
#       the session identifier.
app.secret_key = os.environ.get("SECRET_KEY")

# Configure Redis for storing the session data on the server-side
app.config['SESSION_TYPE'] = 'redis'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_REDIS'] = Redis(host='redis', port=6379)
app.config['SESSION_COOKIE_SAMESITE'] = "Strict"

# Configure the upload path
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create and initialize the Flask-Session object AFTER `app` has been configured
server_session = Session(app)





################################################################################################
################################################################################################
# WILL TAKE SESSION ID THE OLD FASHIONED WAY FROM THE COOKIE (THIS IS FOR WEB APP)
################################################################################################
################################################################################################

# sets up the background image we will be using
@app.route('/set_background', methods=['GET', 'POST'])
def set_background():
    if request.method == 'POST':
        # Save the form data to the session object
        image = request.files['background_image']

        # Generate a new filename
        file_name = "background-" + session.sid 

        image_path = os.path.join(app.config['UPLOAD_FOLDER'], file_name) 
        image.save(image_path)

        session['background'] = file_name
        return redirect(url_for('show_background'))

    return """
        <form method="post" action="/set_background" enctype="multipart/form-data">
            <label for="background-image">Upload your background:</label>
            <input type="file" id="background-image" name="background_image" accept="image/*" required />
            <button type="submit">Submit</button
        </form>
        """

# displays the background image
@app.route('/show_background')
def show_background():
    if session.get('background') is not None:
        return render_template_string("""
                    <img src="{{ url_for('display_image', filename=session['background']) }}">
                    <p> {{ session.sid }} </p>
            """)
    else:
        return render_template_string("""
                    <h1>Welcome! Please upload your image here <a href="{{ url_for('set_background') }}">here.</a></h1>
            """)

# deletes the background image
@app.route('/delete_background')
def delete_background():
    # Clear the background stored in the session object
    os.remove(os.path.join(app.config['UPLOAD_FOLDER'], session['background'])) 
    session.pop('background', default=None)
    return '<h1>Session deleted!</h1>'








################################################################################################
################################################################################################
# WILL TAKE SESSION ID EXPLICITLY FROM REQUEST (THIS IS FOR MOBILE APP)
################################################################################################
################################################################################################

# takes an image -> removes background -> saves as item in session
@app.route('/add_item', methods=['GET', 'POST'])
def add_item():
    if request.method == 'POST':

        # THIS WILL BE LATER EXTRACTED FROM THE REQUEST
        session_sid = session.sid
        

        # Save the sent image to the local storage
        image = request.files['image']
    
        # Generate a new filename
        ts = calendar.timegm(time.gmtime())
        tmp_file_name = "tmp-" + session_sid + "-" + str(ts) + "." + image.filename.split(".")[-1]
    
        # Save a temporary file to be used with the U^2-Net
        tmp_image_path = os.path.join(app.config['UPLOAD_FOLDER'], tmp_file_name) 
        image.save(tmp_image_path)
    
    
        # Remove background from the image
        url = REMBG_URL + "?url=" + urllib.parse.quote_plus("http://web:5000/" + tmp_image_path)
        RM_request = Request(url)
        ret = urlopen(RM_request).read()
    
        # Save the new image
        item_file_name = "item-" + session_sid
        with open(os.path.join(app.config['UPLOAD_FOLDER'], item_file_name),'wb') as output :
            output.write(ret)
        
        # We remove the tmp file
        os.remove(tmp_image_path)

        return item_file_name


    # This is temporary
    return """
        <form method="post" action="/add_item" enctype="multipart/form-data">
            <label for="item-image">Upload your item:</label>
            <input type="file" id="item-image" name="image" accept="image/*" required />
            <button type="submit">Submit</button
        </form>
        """

# Final function to point item on background
# takes camera view of background, and points item in session on background
@app.route('/point_item', methods=[ 'GET', 'POST'])
def point_item():
    if request.method == 'POST':

        # THIS WILL BE LATER EXTRACTED FROM THE REQUEST
        session_sid = session.sid

        # THEN WE DETERMINE ITEM FILE NAME AND BACKGROUND FILE NAME
        background_filename = "background-" + session_sid
        item_filename = "item-" + session_sid


        files = {'screen': open(os.path.join(app.config['UPLOAD_FOLDER'], background_filename), 'rb') , 'view' : request.files['view']}
    
        # Remove background from the image
        r = requests.post(SCREENPOINT_URL, files=files)
        [x,y] = r.text.split(':')
        x = int(x)
        y = int(y)

        # Open the saved photos
        background = Image.open(os.path.join(app.config['UPLOAD_FOLDER'], background_filename))
        item = Image.open(os.path.join(app.config['UPLOAD_FOLDER'], item_filename ))

        # Paste the image in the right spot
        # Use item also as a mask to get transparent background
        background.paste(item, (x,y), item)

        # Save the image now
        background.save(os.path.join(app.config['UPLOAD_FOLDER'], background_filename))

        return r.text

    # This is temporary
    return """
        <form method="post" action="/point_item" enctype="multipart/form-data">

            <label for="view">Upload your view image:</label>
            <input type="file" id="view" name="view" accept="image/*" required />

            <button type="submit">Submit</button
        </form>
        """





################################################################################################
################################################################################################
# DOESN'T EVEN REQUIRE SESSION
################################################################################################
################################################################################################

# Serve uploaded files (VERY VERY VERY BAD, but I'm focused on the functionality for now)
@app.route('/display/<filename>')
def display_image(filename):
	return redirect(url_for('static', filename='uploads/' + filename), code=301)






################################################################################################
################################################################################################
# MAIN STUFF
################################################################################################
################################################################################################

if __name__ == '__main__':
    app.run( host="0.0.0.0" , port=5000 )