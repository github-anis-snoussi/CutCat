FROM python:3.4
ADD . /code
WORKDIR /code
EXPOSE 5000
RUN pip install -r requirements.txt
CMD ["python", "app.py"]