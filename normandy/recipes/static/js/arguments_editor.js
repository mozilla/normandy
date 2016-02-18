(function($, JSONEditor) {
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
                    iconlib: 'fontawesome4',
                    disable_properties: true,
                    disable_collapse: true,
                    theme: 'django'
                });

                // Only assign data if it validates.
                // In the future we might be smarter about this.
                var data = JSON.parse($argumentsJson.val());
                if (!editor.validate(data).length) {
                    editor.setValue(data);
                }
            });
        });
    }

    // Tweaks to the normal theme that aren't possible via CSS.
    JSONEditor.defaults.themes.django = JSONEditor.defaults.themes.html.extend({
        getIndentedPanel: function() {
            var el = this._super();
            el.style.border = 'none';
            return el;
        },

        getTab: function(span) {
            var el = this._super(span);
            $(el).prepend('<i class="fa fa-file-text-o"></i>');
            return el;
        }
    });

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
})(django.jQuery, window.JSONEditor);
