// FullCalendar + Flowbite Modal Integration
if ($('#calendar').length > 0) {
    document.addEventListener('DOMContentLoaded', function () {
        // Ensure Flowbite's Modal class is available
        if (typeof Modal === 'undefined') {
            console.error("Flowbite modal library not found. Please include flowbite.min.js before this script.");
            return;
        }

        var Draggable = FullCalendar.Draggable;
        var containerEl = document.getElementById('external-events');

        // Initialize external draggable events
        if (containerEl) {
            new Draggable(containerEl, {
                itemSelector: '.fc-event',
                eventData: function (eventEl) {
                    var className = eventEl.getAttribute('data-event-classname');
                    return {
                        title: eventEl.innerText.trim(),
                        classNames: [className],
                    };
                },
            });
        }

        var calendarEl = document.getElementById('calendar');
        var calendar = new FullCalendar.Calendar(calendarEl, {
            headerToolbar: {
                start: 'today prev,next',
                center: 'title',
                end: 'dayGridMonth,timeGridWeek,timeGridDay',
            },
            initialView: 'dayGridMonth',
            editable: true,
            droppable: true,
            events: [
                {
                    title: 'Meeting with Team Dev',
                    backgroundColor: '#FFEDF6',
                    textColor: "#FD3995",
                    start: new Date($.now() - 168000000).toJSON().slice(0, 10),
                    end: new Date($.now() - 168000000).toJSON().slice(0, 10),
                },
                {
                    title: 'UI/UX Team...',
                    backgroundColor: '#EDF2F4',
                    textColor: "#0C4B5E",
                    start: new Date($.now() + 338000000).toJSON().slice(0, 10),
                },
                {
                    title: 'Data Update...',
                    backgroundColor: '#F7EEF9',
                    textColor: "#AB47BC",
                    start: new Date($.now() - 338000000).toJSON().slice(0, 10),
                },
                {
                    title: 'Meeting with Team Dev',
                    backgroundColor: '#E8E9EA',
                    textColor: "#212529",
                    start: new Date($.now() + 68000000).toJSON().slice(0, 10),
                },
                {
                    title: 'Design System',
                    backgroundColor: '#FAE7E7',
                    textColor: "#E70D0D",
                    start: new Date($.now() + 88000000).toJSON().slice(0, 10),
                },
            ],

            eventClick: function (info) {
                const modalElement = document.getElementById('event_modal');

                if (!modalElement) {
                    console.error("Modal element with id 'event_modal' not found.");
                    return;
                }

                // Initialize the modal safely
                let modalInstance;
                try {
                    modalInstance = new Modal(modalElement);
                } catch (error) {
                    console.error("Error initializing Flowbite modal:", error);
                    return;
                }

                // Set modal content dynamically
                const eventTitle = document.getElementById('eventTitle');
                if (eventTitle) {
                    eventTitle.innerText = info.event.title;
                }

                // Show the modal
                modalInstance.show();
            },
        });

        calendar.render();
    });
}
