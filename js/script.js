// Pfad zur CSV-Datei
const csvFilePath = 'data/davi_data.csv';

// Laden der CSV-Datei und dann Ausführung des angegebenen Codes
d3.csv(csvFilePath).then(data => {
  // Datenkonvertierung und Sortierung (wie zuvor geschrieben)

  // Nach der Datenkonvertierung, erstelle die Ranglisten
  createRanking('#esg-table', data.sort((a, b) => b.esg_score - a.esg_score), 'esg_score');
  createRanking('#market_capitalization-table', data.sort((a, b) => b.market_capitalization - a.market_capitalization), 'market_capitalization');


  // Erstellen des Streudiagramms mit CheckboxFen
  createScatterplotWithCheckboxes('#scatterplot', data, 'esg_score', 'market_capitalization', 'industry');

  // Erstellen des Donut-Diagramms
  const preparedData = prepareDonutData(data, 'industry', 'full_time_employees');
  createDonutChart('#donut-plot', preparedData);
});

// Funktion zur Erstellung der Rangliste in einem HTML-Element
function createRanking(selector, data, columnName) {
  // Zuerst das vorhandene Element leeren, um Duplikate zu vermeiden
  d3.select(selector).html('');

  // Erstellen der Tabelle
  const table = d3.select(selector).append('table');
  const headers = ['company_name', columnName, 'industry'];
  table.append('thead').append('tr').selectAll('th')
    .data(headers)
    .enter().append('th')
    .text(d => d.charAt(0).toUpperCase() + d.slice(1).replace('_', ' '));  // Formatierung des Headers, um ihn leserlich zu machen

  const rows = table.append('tbody').selectAll('tr')
    .data(data)
    .enter().append('tr');

  // Stellt sicher, dass die Daten korrekt den Zellen zugeordnet werden
  rows.selectAll('td')
    .data(row => [row.company_name, row[columnName], row.industry])
    .enter().append('td')
    .text(d => typeof d === 'number' ? d.toLocaleString() : d);  // Zahlen werden für eine schönere Darstellung formatiert
}

function createScatterplotWithCheckboxes(selector, data, xProp, yProp, industryProp) {
  // Erstellen des SVG-Elements für den Scatterplot
  const margin = { top: 20, right: 150, bottom: 70, left: 80 },
    width = 920 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

  const svg = d3.select(selector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Erstellen des Scatterplots
  createScatterplot(svg, data, width, height, xProp, yProp, industryProp);

  // Hinzufügen der Checkboxen
  addIndustryCheckboxes(data, industryProp, svg);
}

function createScatterplot(svg, data, width, height, xProp, yProp, industryProp) {
  // Erstellen einer Farbskala für verschiedene Industrien
  const color = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(data.map(d => d[industryProp]));

  // X-Achsen-Skala definieren
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => +d[xProp]))
    .range([0, width]);

  // Y-Achsen-Skala definieren
  const y = d3.scaleSqrt()
    .domain(d3.extent(data, d => +d[yProp]))
    .range([height, 0]);

  // Erstellen der Achsen
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));
  svg.append("g")
    .call(d3.axisLeft(y));

  // Hinzufügen von Punkten
  svg.selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => x(+d[xProp]))
    .attr("cy", d => y(+d[yProp]))
    .attr("r", 5)
    .style("fill", d => color(d[industryProp]));

  // Hinzufügen der Legende
  addLegendScatterplot(svg, data, color, width);
}

function addIndustryCheckboxes(data, industryProp, svg) {
  const industries = [...new Set(data.map(d => d[industryProp]))];
  const checkboxContainer = d3.select("#checkbox-container");

  industries.forEach((industry, index) => {
    const checkboxId = `checkbox-${index}`;
    const checkboxGroup = checkboxContainer.append("div")
      .attr("class", "checkbox-group");

    checkboxGroup.append("input")
      .attr("type", "checkbox")
      .attr("class", "industry-checkbox")
      .attr("id", checkboxId)
      .attr("value", industry)
      .property("checked", true);

    checkboxGroup.append("label")
      .attr("class", "checkbox-label")
      .attr("for", checkboxId)
      .text(industry);

    d3.select(`#${checkboxId}`).on("change", function () {
      const checkedIndustries = d3.selectAll('.industry-checkbox:checked').nodes()
        .map(node => node.value);
      svg.selectAll("circle")
        .style("display", d => checkedIndustries.includes(d[industryProp]) ? null : "none");
    });
  });
}

function addLegendScatterplot(svg, data, color, width) {
  const industries = [...new Set(data.map(d => d.industry))];
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width + 20}, 30)`);

  industries.forEach((industry, index) => {
    legend.append("circle")
      .attr("cx", 0)
      .attr("cy", index * 20)
      .attr("r", 5)
      .style("fill", color(industry));

    legend.append("text")
      .attr("x", 10)
      .attr("y", index * 20)
      .text(industry)
      .style("font-size", "10px")
      .attr("alignment-baseline", "middle");
  });
}

// Funktion zum Vorbereiten der Daten für das Donut-Diagramm
function prepareDonutData(data, industryProp, employeeSizeProp) {
  // Verwenden von d3.rollup, um die Daten zu aggregieren
  const industryCounts = d3.rollup(data,
    v => d3.sum(v, d => +d[employeeSizeProp]), // Summiere das 'employeeSizeProp' für jede Gruppe
    d => d[industryProp]); // Gruppierung nach 'industryProp'

  // Konvertieren der Map zurück in ein für d3.pie passendes Array
  const industryArray = Array.from(industryCounts, ([key, value]) => ({ key, value }));

  return industryArray;
}

function createDonutChart(selector, data) {
  // Größe und Marge des Diagramms festlegen
  const width = 800, // Breiter, um Platz für Beschriftungen zu schaffen
    height = 550,
    margin = 100; // Größere Marge für Beschriftungen
  const radius = Math.min(width, height) / 2 - margin;

  // SVG-Element erstellen
  const svg = d3.select(selector)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // Die Farbskala definieren
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Daten für das Diagramm vorbereiten
  const pie = d3.pie()
    .value(d => d.value)
    .sort(null); // um sicherzustellen, dass die Reihenfolge der Daten erhalten bleibt
  const dataReady = pie(data);

  // Der Bogen-Generator für das Donut-Diagramm
  const arc = d3.arc()
    .innerRadius(radius * 0.5) // Für den Donut-Effekt
    .outerRadius(radius);

  // Die Segmente des Donut-Diagramms erstellen
  svg.selectAll('allSlices')
    .data(dataReady)
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', d => color(d.data.key))
    .attr("stroke", "white")
    .style("stroke-width", "2px")

  // Legende erstellen
  const legendContainer = d3.select("#donut-legend");

  data.forEach((d, i) => {
    const legendItem = legendContainer.append("div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("margin-bottom", "5px");

    legendItem.append("div")
      .style("width", "20px")
      .style("height", "20px")
      .style("background-color", color(d.key))
      .style("margin-right", "10px");

    legendItem.append("div")
      .text(`${d.key}: ${d.value}`);
  });
}