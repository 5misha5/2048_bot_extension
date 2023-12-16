document.getElementById("run").addEventListener('click', function () { do_task("run") });
document.getElementById("pause").addEventListener('click', function () { do_task("pause") });


let delay_obj = document.getElementById("delay")
delay_obj.addEventListener('input', function () { do_task("delay") });


$("#slowly").clickAndHold({onHold: function(e,n){do_task("slowly")}});
$("#faster").clickAndHold({onHold: function(e,n){do_task("faster")}});


let run = false



function elem_displaying(element) {

    function hide(id) {
        document.getElementById(id).style.display = 'none';
    };

    function show(id) {
        document.getElementById(id).style.display = 'block';
    };


}



function do_task(task) {

    if (task == "run") {
        run = true
    } else if (task == "slowly") {
        delay_obj.value -= -1 //!TODO more than 0
    } else if (task == "faster") {
        delay_obj.value -= 1
    } else if (task == "pause") {
        run = false
    }
    delay_obj.value = Math.max(0, parseInt(delay_obj.value))

    chrome.tabs.query({
        currentWindow: true,
        active: true

    }, function (tab) {
        chrome.tabs.sendMessage(tab[0].id, { run: run, delay: parseInt(delay_obj.value) })
    });


    
    elem_displaying(task)

}