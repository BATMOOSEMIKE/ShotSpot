import requests
import urllib.request
import urllib.parse
import urllib.error
from bs4 import BeautifulSoup
import ssl
import json
import os
import time

def getlinks(locationid, url):
    try:
        html = urllib.request.urlopen(url, context=ctx).read()
        soup = BeautifulSoup(html, 'html.parser')
        script = soup.find('script', text=lambda t: \
                        t.startswith('window._sharedData'))
        page_json = script.text.split(' = ', 1)[1].rstrip(';')
        data = json.loads(page_json)
        images_links = []
        print ('Scraping links with IG locationid: ' + locationid +"...........")
        for post in data['entry_data']['LocationsPage'][0]['graphql'
            ]['location']['edge_location_to_top_posts']['edges']:
            images_links.append(post['node']['thumbnail_resources'][1]['src'])
        lat = data['entry_data']['LocationsPage'][0]['graphql'
            ]['location']['lat']
        lng = data['entry_data']['LocationsPage'][0]['graphql'
            ]['location']['lng'] 
        return {"lat" : lat, "long" : lng, "links" : images_links}
    except:
        print("Error resolving location ID #" + str(locationid))
        return {"lat" : "40.70", "long" : "-74.0060", "links" : []}


def populateloc(file):
    with open(file, 'r') as openfile: 
        # Reading from json file 
        opened = json.load(openfile) 
    for locs in opened['locations']: #populate
        scraped = getlinks(locs['id'],'https://www.instagram.com/explore/locations/' + locs['id'] + '/')
        if not locs.get('lat'):
            locs.update({"lat" : str(scraped.get('lat'))})
        if not locs.get('long'):
            locs.update({'long' : str(scraped.get('long'))})
        locs['photos'].clear()
        
        for links in scraped.get('links'):
            locs['photos'].append(links)
    # Write new loc
    with open(file, "w") as outfile: 
        json.dump(opened, outfile, indent=4) 

<<<<<<< Updated upstream
#FETCH
while(True):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    # populate loc files in directory with hot photo links
    path = "../server/locations"
    directory = os.fsencode(path)
    for file in os.listdir(directory):
         filename = os.fsdecode(file)
         if filename.endswith(".json"):
            populateloc(path + "/" + filename)
            time.sleep(5) # delay requests by 5 seconds
    time.sleep(300) # call every 5 mins
            
=======
if __name__ == '__main__':
    obj = Insta_Image_Links_Scraper()
    obj.main()
>>>>>>> Stashed changes
