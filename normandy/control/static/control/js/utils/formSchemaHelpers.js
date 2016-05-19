import $RefParser from 'json-schema-ref-parser';

/* Redux forms with complex/nested data structures require
 * a specialized fields array to handle objects and arrays.
 * Eg: ['surveyId', 'surveys[].title', 'defaults.thankYouMessage']
 */
function processProperties(propsObj) {
    let formFields = [];

    Object.keys(propsObj).forEach(key => {
      switch (propsObj[key].type) {
        case "string":
          formFields = formFields.concat([key]);
          break;
        case "integer":
          formFields = formFields.concat([key]);
          break;
        case "object":
          let objectItems = processProperties(propsObj[key].properties);
          objectItems = objectItems.map(objectField => {
            return `${key}.${objectField}`
          });

          formFields = formFields.concat(objectItems);
          break;
        case "array":
          let arrayItems = propsObj[key].items.allOf;
          let arrayFields = [];
          arrayItems.forEach(item => {
            arrayFields = arrayFields.concat(processProperties(item.properties).map(arrayField => {
              return `${key}[].${arrayField}`;
            }));
          });

          formFields = formFields.concat(arrayFields);
          break;
      }
    });

    return formFields;
  };

export function parseJsonSchema(jsonSchema) {
  return $RefParser.dereference(jsonSchema);
}

export function generateFieldsFromSchema(jsonSchema) {
  return processProperties(jsonSchema.properties);
}

export {
  parseJsonSchema,
  generateFieldsFromSchema
}
