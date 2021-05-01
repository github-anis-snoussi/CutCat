# CatCat
## INFOS
- algo for background removal : U^2-Net
- for placing image on background : screenpoint (python package) 

https://pypi.org/project/screenpoint/
https://github.com/danielgatis/rembg


## PS
Always remember to re-build with no cache `sudo docker-compose build --no-cache`


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