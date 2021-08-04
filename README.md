# CutCat

## Video worth a thousand words

https://user-images.githubusercontent.com/33237270/128265329-21e9d5a4-ab36-4bab-8735-88607656f053.mp4




![Architecture Description](./overview.drawio.svg)
## INFOS
- algo for background removal : U^2-Net
- for placing image on background : screenpoint (python package) 

https://pypi.org/project/screenpoint/ <br>
https://github.com/danielgatis/rembg


## PS
- Always remember to re-build with no cache `sudo docker-compose build --no-cache` 
- to generate a new secret key, simply use :
```python
import os
os.urandom(24)
```

- Can run the rembg in its own docker container : `sudo docker run -p 5000:5000  wbenhaddou/rembg-server`
or when `docker-compose up` <br>
open in browser : `http://localhost:8080/?url=https://upload.wikimedia.org/wikipedia/commons/3/31/Cat_on_concrete_floor.JPG`

## Working in a virtualenv

make one :
`virtualenv my_new_env`

connect to it :
`source my_new_env/bin/activate`

install from requirements file :
`pip install -r requirements.txt`

generate requirements file :
`pip freeze —local > requirements.txt`

disconnect from it :
`deactivate`

## TODO
- finish the point-item endpoint
- find a way to share the session between the web and mobile
- find a way to refresh the backgrond each time an item is aded
