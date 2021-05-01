from datetime import timedelta
import os

from redis import Redis
from flask import Flask, render_template_string, request, session, redirect, url_for
from flask_session import Session


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

# Create and initialize the Flask-Session object AFTER `app` has been configured
server_session = Session(app)


@app.route('/set_email', methods=['GET', 'POST'])
def set_email():
    if request.method == 'POST':
        # Save the form data to the session object
        session['email'] = request.form['email_address']
        return redirect(url_for('get_email'))

    return """
        <form method="post">
            <label for="email">Enter your email address:</label>
            <input type="email" id="email" name="email_address" required />
            <button type="submit">Submit</button
        </form>
        """


@app.route('/get_email')
def get_email():
    return render_template_string("""
            {% if session['email'] %}
                <h1>Welcome {{ session['email'] }}!</h1>
            {% else %}
                <h1>Welcome! Please enter your email <a href="{{ url_for('set_email') }}">here.</a></h1>
            {% endif %}
        """)


@app.route('/delete_email')
def delete_email():
    # Clear the email stored in the session object
    session.pop('email', default=None)
    return '<h1>Session deleted!</h1>'


if __name__ == '__main__':
    app.run( host="0.0.0.0" , port=5000 )