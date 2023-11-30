// Pfad zur CSV-Datei
const csvFilePath = 'https://lcedl.github.io/g02/data/DAVI_data.csv';

// Farben der Scala
const myColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', '#aec7e8'];
const globalColorScale = d3.scaleOrdinal(myColors);


// Laden der CSV-Datei und dann Ausführung des angegebenen Codes
d3.csv(csvFilePath).then(data => {

  // Filter out rows with empty 'esg_score' before sorting and creating the table
  const filteredData = data.filter(row => row.esg_score !== null && row.esg_score !== undefined && row.esg_score !== '');

  //Frist Scatterplot Black and white
  createScatterplotblackandwhite("#scatterplot-first-blackandwhite", filteredData, "esg_score", "market_capitalization");


  // Nach der Datenkonvertierung, erstelle die Ranglisten
  //createRanking('#esg-table', data.sort((a, b) => b.esg_score - a.esg_score), 'esg_score'); //Absteigend sortiert
  createRanking('#esg-table', filteredData.sort((a, b) => a.esg_score - b.esg_score), 'esg_score'); // Aufsteigend sortiert
  createRanking('#market_capitalization-table', filteredData.sort((a, b) => b.market_capitalization - a.market_capitalization), 'market_capitalization');

  // Erstellen des Streudiagramms mit CheckboxFen
  createScatterplotWithCheckboxes('#scatterplot', filteredData, 'esg_score', 'market_capitalization', 'industry');

  // Erstelle die Boxplots (environment_score, governance_score, social_score)
  createBoxplot('#boxplot-environment', filteredData, 'environment_score');
  createBoxplot('#boxplot-governance', filteredData, 'governance_score');
  createBoxplot('#boxplot-social', filteredData, 'social_score');

  //Erstelle die MultiSetBar Chart
  createMultiSetBarChart('#barcar-e3score', filteredData)

  // Erstellen des Donut-Diagramms
  const preparedData = prepareDonutData(filteredData, 'industry', 'full_time_employees');
  createDonutChart('#donut-plot', preparedData);
});

//create blackandwhite Scatterplot
function createScatterplotblackandwhite(selector, data, xProp, yProp) {
  const margin = { top: 20, right: 20, bottom: 60, left: 70 },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  const x = d3.scaleLinear()
    .range([0, width])
    .domain(d3.extent(data, d => +d[xProp]));

  const y = d3.scaleSqrt()
    .range([height, 0])
    .domain(d3.extent(data, d => +d[yProp]));

  const svg = d3.select(selector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // X-Achse
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // Y-Achse
  svg.append("g")
    .call(d3.axisLeft(y));

  // X-Achsenlegende
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width / 2 + margin.left)
    .attr("y", height + margin.top + 20)
    .text(xProp.replace(/_/g, ' ')); // Ersetzt Unterstriche durch Leerzeichen

  // Y-Achsenlegende
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height / 2)
    .text(yProp.replace(/_/g, ' ')); // Ersetzt Unterstriche durch Leerzeichen

  // Datenpunkte hinzufügen
  svg.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("r", 3.5)
    .attr("cx", d => x(d[xProp]))
    .attr("cy", d => y(d[yProp]))
    .style("fill", "black"); // Alle Punkte in Schwarz
}


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
  const color = globalColorScale
    .domain(data.map(d => d[industryProp]));

  const margin = { top: 20, right: 20, bottom: 60, left: 70 }

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

  // X-Achsenlegende
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width / 2 + margin.left)
    .attr("y", height + margin.top + 20)
    .text(xProp.replace(/_/g, ' ')); // Ersetzt Unterstriche durch Leerzeichen

  // Y-Achsenlegende
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height / 2)
    .text(yProp.replace(/_/g, ' ')); // Ersetzt Unterstriche durch Leerzeichen

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

function createMultiSetBarChart(selector, data) {
  // Dimensionen und Margen des Diagramms
  const margin = { top: 20, right: 20, bottom: 60, left: 70 },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  // Anhängen des svg-Objekts an das angegebene DOM-Element
  const svg = d3.select(selector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Berechnung der durchschnittlichen Scores mit d3.rollup
  const industryScores = Array.from(d3.rollup(data, v => ({
    environment: d3.mean(v, d => d.environment_score),
    governance: d3.mean(v, d => d.governance_score),
    social: d3.mean(v, d => d.social_score)
  }), d => d.industry)
  ).map(([industry, scores]) => ({ industry, ...scores }));

  // X-Achse
  const x = d3.scaleBand()
    .range([0, width])
    .domain(industryScores.map(d => d.industry))
    .padding(0.2);
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Y-Achse
  const y = d3.scaleLinear()
    .domain([0, d3.max(industryScores, d => Math.max(d.environment, d.governance, d.social))])
    .range([height, 0]);
  svg.append("g")
    .call(d3.axisLeft(y));

  // Funktion, um die Position der Balken zu berechnen
  const barWidth = x.bandwidth() / 3;
  const calculateBarX = (d, index) => x(d.industry) + index * barWidth;

  // Balken für environment_score
  svg.selectAll(".bar.environment")
    .data(industryScores)
    .enter()
    .append("rect")
    .attr("class", "bar environment")
    .attr("x", d => calculateBarX(d, 0))
    .attr("y", d => y(d.environment))
    .attr("width", barWidth)
    .attr("height", d => height - y(d.environment))
    .attr("fill", "#1f77b4");

  // Balken für governance_score
  svg.selectAll(".bar.governance")
    .data(industryScores)
    .enter()
    .append("rect")
    .attr("class", "bar governance")
    .attr("x", d => calculateBarX(d, 1))
    .attr("y", d => y(d.governance))
    .attr("width", barWidth)
    .attr("height", d => height - y(d.governance))
    .attr("fill", "#ff7f0e");

  // Balken für social_score
  svg.selectAll(".bar.social")
    .data(industryScores)
    .enter()
    .append("rect")
    .attr("class", "bar social")
    .attr("x", d => calculateBarX(d, 2))
    .attr("y", d => y(d.social))
    .attr("width", barWidth)
    .attr("height", d => height - y(d.social))
    .attr("fill", "#2ca02c");

  // Legenden-Daten
  const legendData = [
    { label: "Environment Score", color: "#1f77b4" },
    { label: "Governance Score", color: "#ff7f0e" },
    { label: "Social Score", color: "#2ca02c" }
  ];

  // Hinzufügen der Legende
  const legend = svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(legendData)
    .enter().append("g")
    .attr("transform", (d, i) => `translate(0,${i * 20})`);

  // Rechtecke für die Legende
  legend.append("rect")
    .attr("x", width - 19)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", d => d.color);

  // Text für die Legende
  legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text(d => d.label);

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
  const color = globalColorScale;

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

function createBoxplot(selector, data, scoreType) {
  // Definieren der Dimensionen und Margen des SVG-Canvas
  let margin = { top: 10, right: 30, bottom: 90, left: 70 },
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  // Anhängen des SVG-Elements an das gewünschte Div-Element
  let svg = d3.select(selector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Gruppieren der Daten nach Industrie
  let groupedData = d3.group(data, d => d.industry);

  // Erstellen einer ordinalen Farbskala
  let colorScale = globalColorScale.domain(Array.from(groupedData.keys()));

  // Erstellen der X-Skala
  let x = d3.scaleBand()
    .range([0, width])
    .domain(Array.from(groupedData.keys()))
    .padding(0.2);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Erstellen der Y-Skala
  let y = d3.scaleLinear()
    .domain([0, d3.max(data, d => +d[scoreType])])
    .range([height, 0])
    .nice();

  svg.append("g")
    .call(d3.axisLeft(y));

  // Funktion zum Berechnen der Quartile, Whiskers und Ausreißer
  function boxQuartilesAndWhiskers(d) {
    let sorted = d.map(g => g[scoreType]).sort(d3.ascending);
    let q1 = d3.quantile(sorted, .25);
    let median = d3.quantile(sorted, .5);
    let q3 = d3.quantile(sorted, .75);
    let iqr = q3 - q1;
    let min = Math.max(q1 - 1.5 * iqr, 0); // Verhindern, dass der Wert unter 0 fällt
    let max = q3 + 1.5 * iqr;
    let outliers = d.filter(g => g[scoreType] < min || g[scoreType] > max);
    return { q1, median, q3, min, max, outliers };
  }


  // Zeichnen der Boxplots
  groupedData.forEach((groupValues, groupName) => {
    let { q1, median, q3, min, max, outliers } = boxQuartilesAndWhiskers(groupValues);
    let boxWidth = 25;

    // Box mit Farbskala
    svg.append("rect")
      .attr("x", x(groupName) - boxWidth / 2)
      .attr("y", y(q3))
      .attr("width", boxWidth)
      .attr("height", y(q1) - y(q3))
      .attr("stroke", "black")
      .style("fill", colorScale(groupName));

    // Median
    svg.append("line")
      .attr("x1", x(groupName) - boxWidth / 2)
      .attr("x2", x(groupName) + boxWidth / 2)
      .attr("y1", y(median))
      .attr("y2", y(median))
      .attr("stroke", "black");

      /*
    // Unterer Whisker
    svg.append("line")
      .attr("x1", x(groupName))
      .attr("x2", x(groupName))
      .attr("y1", y(min))
      .attr("y2", y(q1))
      .attr("stroke", "black");

    // Oberer Whisker
    svg.append("line")
      .attr("x1", x(groupName))
      .attr("x2", x(groupName))
      .attr("y1", y(max))
      .attr("y2", y(q3))
      .attr("stroke", "black");
  */

    // Ausreißer
    outliers.forEach(d => {
      svg.append("circle")
        .attr("cx", x(groupName))
        .attr("cy", y(d[scoreType]))
        .attr("r", 3)
        .style("fill", "black");
    });

    // Titel zur Y-Achse
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 20)
      .attr("x", 0 - (height / 2))
      .attr("dy", "0.8em")
      .style("text-anchor", "middle")
      .text(scoreType.replace('_', ' ').toUpperCase());
  });
}

