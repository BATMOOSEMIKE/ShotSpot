import requests
import urllib.request
import urllib.parse
import urllib.error
from bs4 import BeautifulSoup
import ssl
import json


class Insta_Image_Links_Scraper:

    def getlinks(self, locationid, url):

        html = urllib.request.urlopen(url, context=self.ctx).read()
        soup = BeautifulSoup(html, 'html.parser')
        script = soup.find('script', text=lambda t: \
                           t.startswith('window._sharedData'))
        page_json = script.text.split(' = ', 1)[1].rstrip(';')
        data = json.loads(page_json)
        print ('Scraping links with locationid: ' + locationid +"...........")
        for post in data['entry_data']['LocationsPage'][0]['graphql'
            ]['location']['edge_location_to_top_posts']['edges']:
            image_src = post['node']['thumbnail_resources'][1]['src']
            hs = open(locationid + '.txt', 'a')
            hs.write(image_src + '\n')
            hs.close()

    def main(self):
        self.ctx = ssl.create_default_context()
        self.ctx.check_hostname = False
        self.ctx.verify_mode = ssl.CERT_NONE

        with open('input.txt') as f:
            self.content = f.readlines()
        self.content = [x.strip() for x in self.content]
        for locationid in self.content:
            self.getlinks(locationid,
                          'https://www.instagram.com/explore/locations/'
                          + locationid + '/')


if __name__ == '__main__':
    obj = Insta_Image_Links_Scraper()
    obj.main()

