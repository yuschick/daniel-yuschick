var xml2js = require('xml2js');

const formatXML = async (data) => {
  const parser = new xml2js.Parser({ explicitArray: false });
  return parser
    .parseStringPromise(data)
    .then((result) => {
      return result;
    })
    .catch((err) => {
      return new Error('Error parsing XML data');
    });
};

export default formatXML;
