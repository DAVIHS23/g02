import pandas as pd

path = 'X:/Projekte/I.BA.DAVI_HS23/g02/data/constituents-financials.csv'

df = pd.read_csv(path)
print(df.head())