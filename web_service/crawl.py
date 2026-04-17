TRUSTED_DOMAINS = [
    "gov.in",
    "nic.in",
    "india.gov.in",
    "uidai.gov.in",
    "incometax.gov.in",
    "gst.gov.in",
    "parivahan.gov.in"
]

def is_trusted_source(url: str):
    return any(domain in url for domain in TRUSTED_DOMAINS)

from crawl4ai import AsyncWebCrawler
import asyncio

async def crawl_page(url):

    if not is_trusted_source(url):
        return None

    async with AsyncWebCrawler() as crawler:

        result = await crawler.arun(url=url)

        if result:
            return result.markdown

        return None


from playwright.sync_api import sync_playwright
def load_dynamic_page(url):

    if not is_trusted_source(url):
        return None

    with sync_playwright() as p:

        browser = p.chromium.launch(headless=True)

        page = browser.new_page()

        page.goto(url)

        html = page.content()

        browser.close()

        return html

    
from bs4 import BeautifulSoup

def extract_text(html):

    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "nav", "footer"]):
        tag.decompose()

    text = soup.get_text(separator=" ")

    return text


def crawl_government_page(url):

    html = load_dynamic_page(url)

    if not html:
        return None

    text = extract_text(html)

    return text[:100]


# doc = crawl_government_page(
#     "https://www.incometax.gov.in/"
# )

# print(doc[:1000])

def collect_documents(urls):

    documents = []

    for url in urls:

        if not is_trusted_source(url):
            continue

        text = crawl_government_page(url)

        if text:
            documents.append(text)

    return documents