export default async function handler(req, res) {
  try {
    const rbiUrl =
      "https://www.rbi.org.in/Scripts/HolidayMatrix.aspx?state=Tamil%20Nadu";

    const response = await fetch(rbiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const html = await response.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(html);
  } catch (err) {
    res.status(500).send("RBI fetch failed");
  }
}
