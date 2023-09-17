curl https://pricing.api.infracost.io/graphql \
  -X POST \
  -H 'X-Api-Key: ico-u8rwzijFi0gZOsJNaeG6k4bAgCKgJceG' \
  ##Not a good key anymore!
  -H 'Content-Type: application/json' \
  --data '
  {"query": "{ products(filter: {vendorName: \"gcp\", 
   service: \"Compute Engine\", 
   region: \"us-east1\", 
   productFamily: \"Compute Instance\", attributeFilters: []}) 
{ prices(filter: {purchaseOption: \"on_demand\"}, {unit: \"hours\"}), { USD } } } "}
  '

{"data":{"products":[]}}