var tasks = {};

var createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);


  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function () {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function (list, arr) {
    // then loop over sub-array
    arr.forEach(function (task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function () {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// delegates clicks to the parent <ul> with class list-group
// the value of 'this' always refers to the entire jQuery element in an .on() callback function
$(".list-group").on("click", "p", function () {
  var text = $(this)
    // will get the inner text content of the current element
    .text()
    // removes any extra white space before or after
    .trim();
  // $("textarea") tells jQuery to find all existing <textarea> elements and uses the element as a selector; $("<textarea>") tells jQuery to create a new <textarea> element and uses the HTML syntax for an opening tage to indicate the element to be created
  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);
  // swaps out existing <p> elements with the new <textarea>
  $(this).replaceWith(textInput);
  // automatically highlights the input box when clicked
  text.Input.trigger("focus");
});

// triggers blur event as soon as the user interacts with anything other than the <textarea> element
$(".list-group").on("blur", "textarea", function () {

  // i.e.:
  // text = "Walk the dog";
  // status = "toDo";
  // index = 0;

  // get the textarea's current value/text
  var text = $(this)
    .val()
    .trim();

  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // tasks is an object; tasks[status] returns an array (i.e. toDo); tasks[status][index] returns the object at the given index in the array; tasks[status][index].text returns the text property of the object at the given index --> tasks.toDo[0].text = "Walk the dog";
  tasks[status][index].text = text;
  // updating tasks was necessary for localStorage, so we call saveTasks() immediately afterwards
  saveTasks();

  // recreate p element
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);

  // replace textarea with p element
  $(this).replaceWith(taskP);
});

// due date was clicked
$(".list-group").on("click", "span", function () {
  // get current text
  var date = $(this)
    .text()
    .trim();

  // create new input element
  var dateInput = $("<input>")
    // with one argument, it gets an attribute (i.e. attr("id")); with two arguments, it sets an attribute (i.e. attr("type","text")) --> type = "text"
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  // swap out elements
  $(this).replaceWith(dateInput);

  // automatically focus on new element
  dateInput.trigger("focus");
});

// value of due date was changed
$(".list-group").on("blur", "input[type='text']", function () {
  // get current text
  var date = $(this)
    .val()
    .trim();

  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array and re-save to localStorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);
});

// turns every element with the class list-group into a sortable list
$(".card .list-group").sortable({
  // links the sortable lists with any other lists that have the same class
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  // tells jQuery to create a copy of the dragged element and move the copy instead of the original; this is necessary to prevent click events from accidentally triggering on the original element.
  helper: "clone",
  // activate and deactivate events trigger once for all connected lists as soon as dragging starts and stops
  activate: function (event) {
    console.log("activate", this);
  },
  deactivate: function (event) {
    console.log("deactivate", this);
  },
  // over and out events trigger when a dragged item enters or leaves a connected list
  over: function (event) {
    console.log("over", event.target);
  },
  out: function (event) {
    console.log("out", event.target);
  },
  // update even triggers when the contents of a list have changed (i.e. the items were re-ordered, an item was removed, or an item was added)
  update: function (event) {
    // array to store the task data in
    var tempArr = [];
    // the children() method returns an array of the list element's children (the <li> elements, labeled as li.list-group-item)
    // loop over current set of children in sortable list
    // jQuery's each() method will run a callback function for every item/element in the array; it's another form of looping, except that a function is now called on each loop iteration
    $(this).children().each(function () {
      // inside the callback function, $(this) actually refers to the child elements at that index; the nested $(this) refers to the task <li> element
      var text = $(this)
        .find("p")
        .text()
        .trim();

      var date = $(this)
        .find("span")
        .text()
        .trim();

      // add task data to the temp array as an object
      tempArr.push({
        text: text,
        date: date
      });

      // trim down list's ID to match object property
      var arrName = $(this)
        .attr("id")
        .replace("list-", "");

      // update array on tasks object and save
      tasks[arrName] = tempArr;
      saveTasks();

    });
  }
});

$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  // how to know which task the user wants to delete: you can't use this b/c it would simply refer to the #trash element that the event belongs to; the event.target wouldn't work either b/c #trash is also the target of the drop; drop(event, ui) --> ui variable is an object that contains a property called draggable; draggable, according to the jQuery documentation, is a jQuery object representing the draggable element
  drop: function(event, ui) {
    // removing a task from any of the lists triggers a sortable update(), meaning the sortable calls saveTasks() for us; jQuery's remove() method works just like a regular JavaScript remove()
    ui.draggable.remove();
    console.log("drop");
  },
  over: function(event, ui) {
    console.log("over");
  },
  out: function(event, ui) {
    console.log("out");
  }
})

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-primary").click(function () {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
    // saves tasks as a string after pushing tastText and taskDate into it
    // var saveTasks = function() {
    //   localStorage.setItem("tasks", JSON.stringify(tasks));
    // };
  }
});

// remove all tasks
$("#remove-tasks").on("click", function () {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();


