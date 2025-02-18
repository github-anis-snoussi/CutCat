FROM python:3.13.2

WORKDIR /usr/src/app
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000
ENTRYPOINT ["./gunicorn.sh"]