# %%
import csv
import io
# %%
def parse_csv_file(file_path:str) -> list[dict[str, str]]:
  """Parses a csv file"""

  entry_list = []
  with open(file_path, mode='r') as file:
    csvFile = csv.DictReader(file)
    for line in csvFile:
      entry_list.append(line)
  return entry_list
# %%
def parse_csv_string(csv_string:str) -> list[dict[str, str]]:
  """Parses a csv string"""

  entry_list = []
  data = csv.DictReader(io.StringIO(csv_string))
  for line in data:
    entry_list.append(line)
  return entry_list
# %%