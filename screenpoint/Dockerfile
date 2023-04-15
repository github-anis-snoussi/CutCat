FROM python:3.9-slim-buster

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

# necessary to updates list of packages even if something heppens
RUN apt-get update -y; exit 0
RUN apt-get install libgtk2.0-dev -y

COPY . .
RUN mkdir -p static/uploads
CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0"]