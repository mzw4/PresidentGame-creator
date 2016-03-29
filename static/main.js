
$(function() {
    // ================== Global vars ==================

    curPanel = '#global_options_panel';
    // win_criterion = ['public image', 'funding']
    win_criterion = {}

    flag_set = new Set()

    _events = {};
    flags = {};

    // ================== Templates ==================
    var event_creation_form_template = Handlebars.compile($("#event_creation_form_template").html());

    var win_criteria_template = Handlebars.compile($("#win_criteria_template").html());
    var choice_template = Handlebars.compile($("#choice_template").html());
    var event_text_template = Handlebars.compile($("#event_text_template").html());
    var flag_template = Handlebars.compile($("#flag_template").html());
    var reply_template = Handlebars.compile($("#reply_template").html());
    var trigger_template = Handlebars.compile($("#trigger_template").html());
    var required_event_template = Handlebars.compile($("#required_event_template").html());
    var required_event_choice_template = Handlebars.compile($("#required_event_choice_template").html());
    var required_points_template = Handlebars.compile($("#required_points_template").html());

    // story viewer templates
    var story_event_template = Handlebars.compile($("#story_event_template").html());
    var story_event_row_template = Handlebars.compile($("#story_event_row_template").html());
    
    // ================== Init ==================
    
    $( ".draggable" ).draggable();

    initSelect(); // materialize select components

    clearEventForm(); // empty event creation form

    Materialize.toast('I am a toast!', 4000) // 4000 is the duration of the toast


    // ================== Event handlers ==================

    // ================== Navigation ==================

    $('#open_event_panel_button').on('click', function(event) {
        event.preventDefault();
        showPanel('#event_creation_panel');
    });

    $('#open_global_options_button').on('click', function(event) {
        event.preventDefault();
        showPanel('#global_options_panel');
    });

    $('#view_story_button').on('click', function(event) {
        event.preventDefault();
        showPanel('#story_view');
        populateStory();
    });

    // ================== Adding components ==================

    $('#event_creation_form').on('submit', function(event) {
        event.preventDefault();
    });
    $(document).keypress(function(e) {
        if(e.which == 13) {
            e.preventDefault();
        }
    });

    $('body').on('click', '.add_choice_button', function(event) {
        event.preventDefault();
        $('#choices').append(choice_template({'win_criterion': Object.keys(win_criterion)}));
        initSelect();    
    });

    $('body').on('click', '#add_win_criteria_button', function(event) {
        event.preventDefault();
        $('#win_criterion').append(win_criteria_template({}));
    });

    $('body').on('click', '.add_event_text_button', function(event) {
        event.preventDefault();
        addIncomingText('');
    });

    $('body').on('click', '.add_trigger_button', function(event) {
        event.preventDefault();
        $(this).prev('.trigger_list').append(trigger_template({}));
    });

    $('body').on('click', '.add_reply_button', function(event) {
        event.preventDefault();
        $(this).prev('.replies').append(reply_template({}));
    });

    // required event choice populate choices
    $('body').on('change', 'select.required_eventchoice_select', function(event) {
        updateReqEventChoiceSelect($(this));
    });

    $('body').on('click', '.add_requirement_button', function(event) {
        event.preventDefault();
        var type = $('#requirement_type_select').val();
        if(type === 'event') {
            $('#requirements').append(required_event_template({ 'events': Object.keys(_events) }));
        } else if (type === 'event_choice') {
            $('#requirements').append(required_event_choice_template({ 'events': Object.keys(_events) }));
        } else {
            $('#requirements').append(required_points_template({'win_criterion': Object.keys(win_criterion)}));
        }
        initSelect();
    });

    // save global options
    $('#save_global_options_button').on('click', function(event) {
        event.preventDefault();

        win_criterion = {}
        $('#global_options_panel .win_criteria').each(function(i, crit_input) {
            var criteria = {}
            var $inputs = $(this).find(':input')
            $inputs.each(function(i, input) {
                criteria[input.name] = $(this).val();
            });
            if(criteria['name']) {
                win_criterion[criteria['name']] = criteria['weight'];
            }
        });
        console.log(win_criterion);
        showToast('Saved game options.')

    });

    // add flag to event choice when enter is pressed
    $('body').on('keyup', '.flag_input', function (e) {
        if (e.keyCode == 13) {
            flag_name = $(this).val()
            if(flag_name) {
                $(this).prev('.flag_list').append(flag_template({'name':flag_name}));
                $(this).val('');
            }
        }
    });

    // click event on story view to edit
    $('body').on('click', '.story_event', function() {
        var name = $(this).find('.event_name').text();
        if(name in _events) {
            populateEventForm(_events[name]);
            showPanel('#event_creation_panel');
        } else {
            showToast('Invalid event, something is wrong.')
        }
    });


    $('body').on('click', '.delete_button', function() {
        $(this).parent().remove();
    });

    $('#new_event_button').on('click', function(event) {
        event.preventDefault();
        clearEventForm();
    });

    $('#save_event_button').on('click', function(event) {
        event.preventDefault();
        var key = saveEvent($('#event_creation_form'));
        showToast('Event saved.')
    });

    $('#export_button').on('click', function(event) {
        event.preventDefault();
        console.log('exporting');
        exportGame();
    });

    $('#load_file_input').on('change', function(event) {
        // get uploaded file
        var files = event.target.files;
        var reader = new FileReader();

        if (files.length > 0) {
            // Closure to capture the file information.
            reader.onload = (function(theFile) {
                return function(e) {
                    var data_json = JSON.parse(e.target.result);
                    loadGameData(data_json);

                    // reset the file form
                    $('form.file-field').get(0).reset();
                };
            })(files[0]);

            reader.readAsText(files[0]);
        }
    });



    function loadGameData(event_data) {
        _events = event_data;
        var event_names = Object.keys(_events);
        event_names.forEach(function(name) {
            populateEventForm(_events[name])
        })
    }

    // initialize all select components
    function initSelect() {
        $('select').material_select();
    }

    // Clear the event creation form
    function clearEventForm() {
        $('#event_creation_form_container').html(event_creation_form_template({}));
    }

    function updateReqEventChoiceSelect($eventSelect) {
        var $select = $eventSelect.closest('.required_event_choice').find('select.required_choice_select');
        
        var eventKey = $eventSelect.val();
        console.log($eventSelect.val());
        if(eventKey in _events) {
            _events[eventKey].choices.forEach(function(choice, i) {
                console.log(choice);
                $select.append('<option value="' + choice.key + '">' + choice.key + '</option>');
            });
            initSelect();
        }
    }


    // Populate the event form with the given event to edit it
    function populateEventForm(e) {
        clearEventForm();
        $eventForm = $('#event_creation_form');

        // info
        setTextInputVal($eventForm, '#event_key', e.name);
        setTextInputVal($eventForm, '#event_time', e.time);
        setTextInputVal($eventForm, '#incoming_from', e.from);

        // incoming
        e.incoming_texts.forEach(function(incoming) {
            addIncomingText(incoming);
        });

        // requirements
        e.requirements.forEach(function(requirement) {
            var type = requirement.type;
            if(type === 'event') {
                $select_input = $(required_event_template({ 'events': Object.keys(_events) }));
                $eventForm.find('#requirements').append($select_input);
                setSelectInputVal($select_input, '.required_event_select', requirement.event_key);
            } else if (type === 'event_choice') {
                $select_input = $(required_event_choice_template({ 'events': Object.keys(_events) }));
                $eventForm.find('#requirements').append($select_input);
                setSelectInputVal($select_input, 'select.required_eventchoice_select', requirement.event_key);
                updateReqEventChoiceSelect($select_input.find('select.required_eventchoice_select'));
                setSelectInputVal($select_input, 'select.required_choice_select', requirement.choice);
            } else {
                $select_input = $(required_points_template({'win_criterion': Object.keys(win_criterion)}));
                $eventForm.find('#requirements').append($select_input);
                setSelectInputVal($select_input, '.required_points_category_select', requirement.points_category);
                setTextInputVal($select_input, '.required_val', requirement.val);
            }
        });
    
        // triggers
        e.triggers.forEach(function(trig) {
            $eventForm.find('.trigger_list')
                .append(trigger_template({'event_key': trig.event_key, 'event_time': trig.time }));
        });

        // choices
        e.choices.forEach(function(choice) {
            // add choice and fill info
            var $choice_html = $(choice_template({
                'win_criterion': Object.keys(win_criterion),
                'key': choice.key,
                'text': choice.text
            }));
            $('#choices').append($choice_html);
            initSelect();

            // replies
            choice.replies.forEach(function(reply) {
                $choice_html.find('.replies').append(reply_template({ 'text': reply }));
            });

            // effects
            var effects_names = Object.keys(choice.effects);
            $choice_html.find('.win_condition_effect').each(function(i, eff) {
                setSelectInputVal($(eff), 'select', effects_names[i]);
                setTextInputVal($(eff), 'input', choice.effects[effects_names[i]]);
            })

            // triggers
            choice.triggers.forEach(function(trig) {
                $choice_html.find('.trigger_list')
                    .append(trigger_template({'event_key': trig.event_key, 'event_time': trig.time }));
            });

            // flags
            choice.flags.forEach(function(flag) {
                $choice_html.find('.flag_list').append(flag_template({'name':flag}));
            })
        });

        
    }

    // Display the specified panel
    function showPanel(panelId) {
        $(curPanel).fadeOut(100, function() {
            $(panelId).fadeIn(100, function() {
                curPanel = panelId;
            });
        });
    }

    // Populate the story view panel
    function populateStory() {
        var $story_view = $('#story_view');
        // clear story view
        $story_view.html('');

        // populate events
        var times = [];
        event_keys = Object.keys(_events);
        event_keys.forEach(function(name) {
            var e = _events[name];
            if (!isInt(e.time)) {
                console.log('Invalid event time');
                console.log(e);
                return;
            }

            var time = parseInt(e.time);
            var row_template = story_event_row_template({'time': time});

            // insert row if necessary, figure out where
            if (times.length === 0) {
                $story_view.prepend(row_template);
            } else if (times[times.length-1] < time) {
                $story_view.append(row_template);
            } else {
                for(var i = 0; i < times.length; i++) {
                    if (times[i] === time) {
                        break;
                    }
                    if (times[i] > time) {
                        $story_view.find('#row_' + times[i]).before(row_template);
                    }
                }
            }

            $story_view.find('#row_' + time + ' .story_event_row').append(story_event_template({'name': e.name, 'choices': e.choices}));
            times.push(time);
        })
    }

    // Export game to file by making call to Flask webserver
    function exportGame() {
        var game_settings = {}
        game_settings['points_categories'] = win_criterion;

        var data = {}
        data['game_settings'] = game_settings;
        data['events'] = _events;
        data['flags'] = flag_set;

        console.log({'data': JSON.stringify(data) });

        $.post('/save_game', {'data': JSON.stringify(data) }, function(response) {
            console.log(response);
            showToast('Exported game.');
        });
    }

    // Save the event to memory
    function saveEvent($eventForm) {
        // event info
        var $info = $eventForm.find('#event_info');
        var key = $info.find('#event_key').val();
        var time = $info.find('#event_time').val();

        // incoming texts
        var incoming_from = $eventForm.find('#incoming_from').val();

        var incoming_texts = [];
        $eventForm.find('#event_texts .incoming_text').each(function(i, text) {
            incoming_texts.push($(text).val());
        });

        // requiremnts
        var requirements = []
        var $requirements = $eventForm.find('#requirements');
        $requirements.find('.required_event').each(function(i, req) {
            var req_obj = {}
            req_obj['type'] = 'event';
            req_obj['event_key'] = $(req).find('select.required_event_select').val();
            requirements.push(req_obj);
        });
        $requirements.find('.required_event_choice').each(function(i, req) {
            var req_obj = {}
            req_obj['type'] = 'event_choice';
            req_obj['event_key'] = $(req).find('select.required_eventchoice_select').val();
            req_obj['choice'] = $(req).find('select.required_choice_select').val();
            requirements.push(req_obj);
        });
        $requirements.find('.required_points').each(function(i, req) {
            var req_obj = {}
            req_obj['type'] = 'points';
            req_obj['points_category'] = $(req).find('select.required_points_category_select').val();
            req_obj['val'] = $(req).find('.required_val').val();
            requirements.push(req_obj);
        });

        // triggers
        var event_triggers = [];
        $eventForm.find('#event_triggers .trigger_list .trigger').each(function(i, trig) {
            var eventKey = $(trig).find('#event_key').val();
            var time = $(trig).find('#event_time').val();
            if(eventKey) {
                event_triggers.push(createTrigger(eventKey, time));
            }
        });

        // get choices
        var choices = []
        $eventForm.find('.choice').each(function(i, choice) {
            $choice = $(choice);
            var key = $choice.find('#event_choice_key').val()
            var text = $choice.find('#event_choice_text').val()

            // choice replies
            var replies = []
            $choice.find('.replies .reply_item .reply_text').each(function(i, reply) {
                replies.push($(reply).val());
            });

            // choice win condition effects
            var effects = {}
            $choice.find('.win_condition_effect').each(function(i, eff) {
                var condition = $(eff).find('select').val();
                var val = $(eff).find('.effect_val').val();
                if(condition && val !== 0) {
                    effects[condition] = val;
                }
            });

            // choice triggers
            var triggers = [];
            $choice.find('.trigger_list .trigger').each(function(i, trig) {
                var eventKey = $(trig).find('#event_key').val();
                var time = $(trig).find('#event_time').val();
                if(eventKey) {
                    triggers.push(createTrigger(eventKey, time));
                }
            });

            // choice flags
            var flags = [];
            $choice.find('.flag_list .flag_name').each(function(i, flag) {
                var flag_name = $(flag).text();
                if (flag_name) {
                    flags.push(flag_name);
                }
            });


            var choice = createChoice(key, text, effects, triggers, flags, replies);
            choices.push(choice);
        });

        createEvent(key, time, incoming_texts, incoming_from, requirements, event_triggers, choices);
        return key;
    }

    /**
     * Create a choice
     */
    function createTrigger(eventKey, time) {
        trigger = {
            'event_key': eventKey,
            'time': time
        }
        return trigger;
    }

    /**
     * Create a choice
     */
    function createChoice(key, text, effect, triggers, flags, replies) {
        choice = {
            'key': key,
            'text': text,
            'effects': effect,
            'triggers': triggers,
            'flags': flags,
            'replies': replies
        }
        return choice;
    }

    /**
     * Create an event
     */
    function createEvent(name, time, incoming_texts, from, requirements, triggers, choices) {
        children = [];
        choices.forEach(function(choice) {
            choice.triggers.forEach(function(trig) {
                children.push(trig.event_key);
            });
        });

        game_event = {
            'name': name,
            'time': time,
            'incoming_texts': incoming_texts,
            'from': from,
            'requirements': requirements,
            'triggers': triggers,
            'choices': choices,
            'children': children
        }
        _events[name] = game_event;
        console.log(game_event);
        return game_event;
    }

    // Component adding function

    function setTextInputVal($source, $el, val) {
        var $input = $source.find($el);
        $input.val(val);
        $input.next('label').addClass('active');
    }

    function setSelectInputVal($source, $el, val) {
        var $input = $source.find($el);
        $input.val(val);
        initSelect();
    }

    function addIncomingText(text) {
        $('#event_texts').append(event_text_template({'text': text}));
    }

});






// Utility functions


function showToast(text) {
    Materialize.toast(text, 2000);
}

function isInt(n) {
  return !isNaN(parseInt(n)) && isFinite(n);
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

