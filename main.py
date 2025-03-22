import re
import pandas
import requests
import glob

def format_timestamp( timestamp ):
  pattern = re.compile( r"(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).*" )
  match = pattern.match(timestamp)
  if match:
    year, month, day, hour, minute, second = match.groups()
    return "{:04}{:02}{:02}{:02}{:02}{:02}".format(int(year), int(month), int(day), int(hour), int(minute), int(second))
  else:
    raise ValueError( "Invalid timestamp format" )

# Determine the URI to download the data from
default_cards_uri = "https://api.scryfall.com/bulk-data/default-cards"
default_cards_response = requests.get( default_cards_uri )
default_cards_updated_at = format_timestamp( default_cards_response.json()['updated_at'] )
if glob.glob( "bulk-cards-" + default_cards_updated_at + ".csv" ):
  print( "The cached data is alredy up to date" )
  exit(0)
download_uri = default_cards_response.json()['download_uri']
print( "Data URI: " + download_uri )

# exit(0)

# Download the data
print( "Downloading..." )
download_response = requests.get( download_uri )
data = download_response.json()
print( "Downloaded " + str(len( data )) + " records" )
 
# Create an empty list to store filtered objects
filtered_objects = []
 
# Filter objects based on "digital" value
for obj in data:
  legal = obj['object'] == 'card' \
    and obj['lang'] == 'en' \
    and obj['legalities']['commander'] == 'legal' \
    and obj['digital'] == False \
    and obj['border_color'] != 'gold' \
    and ( \
      (obj['prices']['usd'] != None and float(obj['prices']['usd']) < 0.80) \
      or (obj['prices']['usd_foil'] != None and float(obj['prices']['usd_foil']) < 0.80) \
      or (obj['prices']['usd_etched'] != None and float(obj['prices']['usd_etched']) < 0.80) \
    )
  if legal:
    filtered_objects.append( obj )
    
# Extract "name" and "oracle_id" values from filtered_objects
names_and_oracle_ids = []
for obj in filtered_objects:
  names_and_oracle_ids.append({
     "oracle_id": obj["oracle_id"],
     "name": obj["name"]
  })

# Sort by "oracle_id"
names_and_oracle_ids = sorted( names_and_oracle_ids, key = lambda obj: obj["oracle_id"] )

# Remove duplicates based on "oracle_id"
filtered_names_and_oracle_ids = []
previous_oracle_id = None
for item in names_and_oracle_ids:
    if item["oracle_id"] != previous_oracle_id:
        filtered_names_and_oracle_ids.append( item )
    previous_oracle_id = item["oracle_id"]

# Output dataframe to a CSV file
data_frame = pandas.DataFrame.from_records( filtered_names_and_oracle_ids )
data_frame.to_csv( 'bulk-cards-' + default_cards_updated_at + '.csv', index = False, encoding='utf-8' )