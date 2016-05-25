import $RefParser from 'json-schema-ref-parser';
import { _ } from 'underscore';

/* Redux forms with complex/nested data structures require
 * a specialized fields array to handle objects and arrays.
 * Eg: ['surveyId', 'surveys[].title', 'defaults.thankYouMessage']
 */
function processProperties(orderedPropNames, propsObj) {
  let reduxFormFields = [];
  let props = {};

  orderedPropNames.forEach(key => {
    switch (propsObj[key].type) {
      case "object":
        props = propsObj[key].properties;

        let objectFields = processProperties(orderPropNames(props), props)
          .map(objectField => `${key}.${objectField}`);

        reduxFormFields = reduxFormFields.concat(objectFields);
        break;

      case "array":
        (propsObj[key].items.allOf).forEach(item => {
          props = { ...item.properties, ...props };
        });

        let arrayFields = processProperties(orderPropNames(props), props)
          .map(arrayField => `${key}[].${arrayField}`);

        reduxFormFields = reduxFormFields.concat(arrayFields);
        break;

      default:
        reduxFormFields = reduxFormFields.concat([key]);
    }
  });

  return reduxFormFields;
};

function orderPropNames(propsObj) {
  return _.sortBy(Object.keys(propsObj), key => {
    return propsObj[key].propertyOrder;
  });
}

export function parseJsonSchema(jsonSchema) {
  return $RefParser.dereference(jsonSchema);
}

export function generateFieldsFromSchema(jsonSchema) {
  let props = jsonSchema.properties;
  return processProperties(orderPropNames(props), props);
}

export {
  parseJsonSchema,
  generateFieldsFromSchema
}
