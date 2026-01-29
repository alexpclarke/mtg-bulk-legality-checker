import glob
import re

import pandas
import requests


def format_timestamp( timestamp ):
  pattern = re.compile( r"(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).*" )
  match = pattern.match(timestamp)
  if match: 
    year, month, day, hour, minute, second = match.groups()
    return "{:04}{:02}{:02}{:02}{:02}{:02}".format(int(year), int(month), int(day), int(hour), int(minute), int(second))
  else:
    raise ValueError( "Invalid timestamp format" )

import json

# Prompt for JSON file path
json_path = input("Enter path to Scryfall JSON file (leave blank to fetch from Scryfall API): ").strip()

# Determine the URI to download the data from
default_cards_uri = "https://api.scryfall.com/bulk-data/default-cards"
default_cards_response = requests.get(default_cards_uri)
default_cards_updated_at = format_timestamp(default_cards_response.json()['updated_at'])
output_filename = "bulk-cards-" + default_cards_updated_at + ".csv"

if glob.glob(output_filename):
  print("The cached data is already up to date")
  df = pandas.read_csv(output_filename, index_col='Name')
  legal_cards_by_name = df['Legality'].to_dict()
else:
  if json_path:
    print(f"Loading card data from {json_path}...")
    with open(json_path, "r", encoding="utf-8") as f:
      data = json.load(f)
    print("Loaded " + str(len(data)) + " records from JSON file")
  else:
    download_uri = default_cards_response.json()['download_uri']
    print("Data URI: " + download_uri)
    print("Downloading...")
    download_response = requests.get(download_uri)
    data = download_response.json()
    print("Downloaded " + str(len(data)) + " records")

  cards_by_oracle_id = dict()
  for obj in data:
    if obj['object'] != 'card':
      continue
    if obj['lang'] != 'en':
      continue
    if obj['digital'] == True:
      continue
    if obj['border_color'] == 'gold':
      continue
    type_line = obj.get('type_line')
    if type_line is None:
      continue
    # Filter out tokens
    if 'Token' in type_line:
      continue
    # Filter out art cards and non-card objects
    if type_line == "Card" or type_line == "Card // Card":
      continue
    # Filter out Emblems
    if 'Emblem' in type_line:
      continue
    # Filter out objecets with no oracle_id
    oracle_id = obj.get('oracle_id')
    if oracle_id == None:
      continue
    if oracle_id not in cards_by_oracle_id:
      cards_by_oracle_id[oracle_id] = list()
    cards_by_oracle_id[oracle_id].append(obj)

  legal_cards_by_oracle_id = dict()
  oracle_id_by_name = dict()
  for oracle_id, cards in cards_by_oracle_id.items():
    if len(cards) == 0:
      continue

    # Map names to oracle_ids
    for card in cards:
      card_faces = card.get('card_faces')
      if card_faces is not None and len(card_faces) > 1:
        front_face = card_faces[0]
        front_face_flavor_name = front_face.get('flavor_name')
        if front_face_flavor_name is not None:
          if front_face_flavor_name not in oracle_id_by_name:
            oracle_id_by_name[front_face_flavor_name] = oracle_id
          elif oracle_id_by_name[front_face_flavor_name] != oracle_id:
            print("Warning: Collision for name " + front_face_flavor_name + ": oracle_ids " + oracle_id_by_name[front_face_flavor_name] + " and " + oracle_id)
          continue
        front_face_name = front_face.get('name')
        if front_face_name is not None:
          if front_face_name not in oracle_id_by_name:
            oracle_id_by_name[front_face_name] = oracle_id
          elif oracle_id_by_name[front_face_name] != oracle_id:
            print("Warning: Collision for name " + front_face_name + ": oracle_ids " + oracle_id_by_name[front_face_name] + " and " + oracle_id)
          continue
      flavor_name = card.get('flavor_name')
      if flavor_name is not None:
        if flavor_name not in oracle_id_by_name:
          oracle_id_by_name[flavor_name] = oracle_id
        elif oracle_id_by_name[flavor_name] != oracle_id:
          print("Warning: Collision for name " + flavor_name + ": oracle_ids " + oracle_id_by_name[flavor_name] + " and " + oracle_id)
        continue
      name = card.get('name')
      if name is not None:
        if name not in oracle_id_by_name:
          oracle_id_by_name[name] = oracle_id
        elif oracle_id_by_name[name] != oracle_id:
          print("Warning: Collision for name " + name + ": oracle_ids " + oracle_id_by_name[name] + " and " + oracle_id)
        continue
      print("Warning: Could not find any name for oracle_id " + oracle_id)
          
    # Basic lands are always legal
    all_basic_lands = True
    all_not_basic_lands = True
    for card in cards:
      if 'Basic Land' in card.get('type_line', ''):
        all_not_basic_lands = False
      else:
        all_basic_lands = False
    if all_basic_lands:
      legal_cards_by_oracle_id[oracle_id] = "Legal"
      continue
    if not all_not_basic_lands:
      print("Warning: Mixed basic land status for oracle_id " + oracle_id)
      continue

    # Filter out cards that are not legal in commander
    all_legal = True
    all_not_legal = True
    for card in cards:
      if card['legalities']['commander'] == 'legal':
        all_not_legal = False
      else:
        all_legal = False
    if not all_legal and not all_not_legal:
      print("Warning: Mixed commander legality for oracle_id " + oracle_id)
      continue
    if not all_legal:
      legal_cards_by_oracle_id[oracle_id] = "Not legal in commander"
      continue

    # Find the cheapest print
    cheapest_price = None
    for card in cards:
      for price_key in ['usd', 'usd_foil', 'usd_etched']:
        price_str = card['prices'][price_key]
        if price_str != None:
          price = float(price_str)
          if cheapest_price == None or price < cheapest_price:
            cheapest_price = price

    # Filter out cards with no price data
    if cheapest_price == None:
      legal_cards_by_oracle_id[oracle_id] = "No price data"
      continue

    # Filter out cards with price >= $0.80
    if cheapest_price >= 0.80:
      legal_cards_by_oracle_id[oracle_id] = "Cheapest print is ${:.2f}".format(cheapest_price)
      continue

    # If we reach here, the card is legal
    legal_cards_by_oracle_id[oracle_id] = "Legal"

  # For each name in oracle_id_by_name, add that card's name, oracle_id, and legality status to a csv file sorted by name
  legal_cards_by_name = dict() 
  rows = list()
  for name, oracle_id in oracle_id_by_name.items():
    legality = legal_cards_by_oracle_id.get(oracle_id)
    legal_cards_by_name[name] = legality
    rows.append( (name, oracle_id, legality) )
  rows.sort( key=lambda x: x[0] )
  df = pandas.DataFrame( rows, columns=['Name', 'Oracle ID', 'Legality'] )
  df.set_index('Name', inplace=True)
  df.to_csv( "src/data_files/" + output_filename )
  print("Wrote legality data to src/data_files/" + output_filename)