FROM python:3.4-alpine
ADD . /usr/src/app
WORKDIR /usr/src/app
EXPOSE 5000
RUN pip install -r requirements.txt
ENTRYPOINT ["./gunicorn.sh"]