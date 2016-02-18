(function($) {
    'use strict';

    /**
     * Initialize a recipe action row for the arguments editor.
     * @param  {jQuery object} $row
     */
    function initialize($row) {
        var $actionSelect = $row.find('[name$="-action"]');
        var $argumentsJson = $row.find('[name$="-arguments_json"]');
        var $editorElement = $('<div class="arguments-editor"></div>').insertBefore($argumentsJson);
        var editor = null;

        // Update the backing textarea before submitting.
        $row.parents('form').submit(function() {
            if (editor !== null) {
                $argumentsJson.val(JSON.stringify(editor.getValue()));
            }
        });

        // When the action type changes, remove the existing editor and
        // create a new one.
        $actionSelect.change(function() {
            if (editor !== null) {
                editor.destroy();
                editor = null;
            }

            if ($actionSelect.val() === '') {
                return;
            }

            var actionName = $actionSelect.find('option:selected').text();
            $.getJSON('/api/v1/action/' + actionName + '/', function(action) {
                editor = new JSONEditor($editorElement[0], {
                    schema: action.arguments_schema,
                    startval: JSON.parse($argumentsJson.val())
                });
            });
        });
    }

    // Initialize existing rows.
    $(function() {
        $('#recipeaction_set-group tr.form-row:not(.empty-form)').each(function(i, row) {
            initialize($(row));
        });
    });

    // Whenever a new row is added, initialize it.
    $(document).on('formset:added', function(ev, $row, formsetName) {
        if (formsetName === 'recipeaction_set') {
            initialize($row);
        }
    });
})(django.jQuery);
