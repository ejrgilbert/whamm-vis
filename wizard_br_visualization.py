# %%
import parse_csv as pcsv

# %%
def wiz_br_vis(csv_file_path:str)-> None:
    br_if_pairs = {}
    parsed_csv = pcsv.parse_csv_file(csv_file_path)
    for line in parsed_csv:
        if not br_if_pairs[line["fid:pc"]]:
            br_if_pairs[line["fid:pc"]] = {}
        br_if_pairs[line["fid:pc"]][line["name"]] = line["value(s)"]
    


###########

# %%
"""
func "main":
  +13 br_if:     [1, 0]
func "call_target":
   +5 br_if:     [1, 0]
"""