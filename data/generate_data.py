import pandas as pd
import numpy as np
import random

# Setzen eines Seeds für die Reproduzierbarkeit
np.random.seed(0)
random.seed(0)

# Anzahl der Datensätze
num_entries = 500

# Generieren von Beispieldaten
prefixes = [
    "Advanced", "Alpha", "Apex", "Atlas", "Blue", "Bright", "Broad",
    "Capital", "Cedar", "Central", "Choice", "Cirrus", "Classic",
    "Coastal", "Collective", "Crest", "Crown", "Deep", "Delta",
    "Dynamic", "East", "Elite", "First", "Forward", "Global", "Grand",
    "High", "Hyper", "Iconic", "Infinite", "Iron", "Keystone",
    "Leading", "Legacy", "Major", "Metro", "Motion", "North", "Nova",
    "Omega", "Pacific", "Paramount", "Peak", "Pioneer", "Prime",
    "Principal", "Pro", "Quantum", "Quest", "Rapid", "Redwood",
    "Regal", "Right", "River", "Royal", "Silver", "Solar", "Southern",
    "Sterling", "Summit", "Sunrise", "Supreme", "Terra", "Titan",
    "United", "Urban", "Vanguard", "West", "Zenith"
]
suffixes = [
    "Analytics", "Automations", "Capital", "Clinics", "Commodities",
    "Communications", "Concepts", "Constructions", "Consultancy",
    "Corporation", "Creations", "Dynamics", "Electronics", "Elements",
    "Engineering", "Enterprises", "Entertainment", "Essentials",
    "Financial", "Foundations", "Group", "Holdings", "Horizons",
    "Insights", "Instruments", "Insurance", "International",
    "Investments", "Laboratories", "Logistics", "Media", "Mobility",
    "Networks", "Partners", "Productions", "Professionals", "Realty",
    "Security", "Services", "Studios", "Technologies", "Ventures",
    "Visions", "Works"
]

esg_scores = np.random.randint(20, 100, size=num_entries)  # ESG Scores zwischen 20 und 99

# Firmenwerte erzeugen, die mit dem ESG-Score korrelieren
# Die Basis für die Werte wird eine zufällige Zahl zwischen 1 Million und 4 Millionen sein
base_values = np.random.randint(1000000, 4000000, size=num_entries)
# Wir fügen eine Komponente hinzu, die auf dem ESG-Score basiert, um eine Korrelation zu schaffen
# Zum Beispiel: Ein höherer ESG-Score erhöht den Wert um einen Faktor
value_bonus = (esg_scores - 20) / 80  # Normieren der ESG-Scores auf einen Bereich von 0 bis 1
values = base_values + (value_bonus * base_values * 0.5).astype(int)  # Bis zu 50% Wertsteigerung basierend auf dem ESG-Score

# Erstellen von Firmennamen durch zufälliges Kombinieren von Präfixen und Suffixen
companies = [random.choice(prefixes) + random.choice(suffixes) + str(np.random.randint(1, 1000)) for _ in range(num_entries)]

# Liste der Branchen
industries = [
    "Technology", "Healthcare", "Finance", "Manufacturing", "Retail", 
    "Education", "Real Estate", "Transportation", "Energy", "Agriculture"
]

# Zufällige Zuweisung einer Branche für jede Firma
random_industries = [random.choice(industries) for _ in range(num_entries)]

# Erstellen eines DataFrame
df = pd.DataFrame({
    'company': companies,
    'esg_score': esg_scores,
    'value': values,
    'industry': random_industries  # Hinzufügen der Branche
})

# Mischen der Einträge für Vielfalt
df = df.sample(frac=1).reset_index(drop=True)

# Speichern des aktualisierten DataFrames als CSV-Datei
file_path = 'data/data.csv'
df.to_csv(file_path, index=False)

file_path  # Zurückgeben des Pfades der erstellten CSV-Datei