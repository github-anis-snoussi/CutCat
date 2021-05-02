from datetime import timedelta
import os
import calendar
import time

from redis import Redis
from flask import Flask, render_template_string, request, session, redirect, url_for
from flask_session import Session

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

# Configure the upload path
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create and initialize the Flask-Session object AFTER `app` has been configured
server_session = Session(app)


@app.route('/set_background', methods=['GET', 'POST'])
def set_background():
    if request.method == 'POST':
        # Save the form data to the session object
        image = request.files['background_image']

        # Generate a new filename
        ts = calendar.timegm(time.gmtime())
        file_name = "background-" + str(ts) + "." + image.filename.split(".")[-1]

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


@app.route('/show_background')
def show_background():
    if session['background'] :
        return render_template_string("""
                    <img src="{{ url_for('display_image', filename=session['background']) }}">
            """)
    else:
        return render_template_string("""
                    <h1>Welcome! Please upload your image here <a href="{{ url_for('set_background') }}">here.</a></h1>
            """)


@app.route('/delete_background')
def delete_background():
    # Clear the background stored in the session object
    session.pop('background', default=None)
    return '<h1>Session deleted!</h1>'


# Serve uploaded files (VERY VERY VERY BAD, but I'm focused on the functionality for now)
@app.route('/display/<filename>')
def display_image(filename):
	return redirect(url_for('static', filename='uploads/' + filename), code=301)


if __name__ == '__main__':
    app.run( host="0.0.0.0" , port=5000 )