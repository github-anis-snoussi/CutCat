FROM python:3.4

WORKDIR /usr/src/app
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY . .
RUN mkdir -p static/uploads

EXPOSE 5000
ENTRYPOINT ["./gunicorn.sh"]