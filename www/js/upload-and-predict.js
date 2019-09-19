+ function($) {
    'use strict';

    // UPLOAD CLASS DEFINITION
    // ======================

    var dropZone = document.getElementById('drop-zone');
    var uploadForm = document.getElementById('js-upload-form');
    var steps = 0
    var fileCount = 0

    var initializeProgressbar = function(){
        steps = 0
        $("#progressbar-upload").attr('aria-valuenow', 0).css('width', '0%');
        $("#progressbar-status").html('0% Complete');
    }

    var uploadProgressbar = function(value){
        steps += 1
        value = Math.ceil(value*steps);
        $("#progressbar-upload").attr('aria-valuenow', value).css('width', value.toString()+'%');
        $("#progressbar-status").html(value.toString()+ '% Complete');
    }

    var startUpload = function(files) {

        initializeProgressbar()
        let step = parseFloat(100 / files.length)
        
        for(let i=0; i < files.length; i++){
            
            if (files[i]) { 
                
                var reader = new FileReader();
                reader.readAsText(files[i], "UTF-8");
                reader.onload = function (evt) {
                   
                    $.ajax({
                        url: 'http://localhost:5000/api/classification/classify',      //TODO change address
                        method:'POST',
                        type:'POST',
                        contentType: 'text/plain',
                        dataType: 'json', // Tell jQuery what kind of response to expect
                        data: evt.target.result.toString(),
                    })
                    .done(function(response) {

                        if($("#btn-remove-all-processed").is( ":hidden" )){
                            $("#btn-remove-all-processed").show()
                        }

                        uploadProgressbar(step)
                        let warningOrSuccess = response.defective ? 'warning' : 'success' 
                        let alert = response.defective ? 'alert-warning' : 'alert-success' 
                        
                        let a = $('<a href="#" class="list-group-item list-group-item-'+warningOrSuccess+'"><span class="badge '+ alert + ' pull-right">'+ (++fileCount) +'</span> '+files[i].name+' </a>')
                        
                        a.data('content', evt.target.result.toString())
                        a.data('isdefective', response.defective)
                        a.data('metrics', response.metrics)
                        a.click(function(){
                            
                            $("#predictionInfoModal").modal();
                            $("#icon-bomb").hide();

                            if($(this).data().isdefective){
                                $("#icon-bomb").show();
                            }
                            
                            // Populate table
                            if ($.fn.dataTable.isDataTable('#dataTable')) {
                                $('#dataTable').DataTable();
                            }
                            else {
                                $('#dataTable').DataTable({
                                    data: setupDataForTable($(this).data().metrics),
                                    columns : [{
                                        "data" : "name"
                                    }, {
                                        "data" : "value"
                                    },{
                                        "data" : null, 
                                        render: function ( data, type, row ) {
                                            return '<input type="checkbox"></input>'
                                        }
                                    }] 
                                });
                            }
                            
                            $("#file-content").html($(this).data().content);
                        });

                        let status = $('<span class="badge '+ alert +' pull-right" style="float: right; margin-right: 10px"> '+ (response.defective ? 'Defective' : 'Defect free') + '</span>')
                        let x = $('<i class="fas fa-trash" style="text-align: center; float: right"></i>')
                        x.click(function(e){
                            a.remove();
                        });

                        a.append(x, status)
                        $("#processed-files-list").append(a)                        
                    })
                    .fail(function () {
                        
                        if($("#btn-remove-all-failed").is( ":hidden" )){
                            $("#btn-remove-all-failed").show()
                        }

                        uploadProgressbar((i+1)*step)
                        
                        let a = $('<a href="#" class="list-group-item list-group-item-danger"><span class="badge alert-danger pull-right">'+ (++fileCount) +'</span> '+files[i].name+' </a>')
                        let x = $('<i class="fas fa-trash" style="text-align: center; float: right"></i>')
                        x.click(function(){
                            a.remove();
                        });

                        let status = $('<span class="badge alert-danger pull-right" style="float: right; margin-right: 10px"> Failed </span>')
                        a.append(x, status)
                        $("#processed-files-list").append(a)
                    }) 
                }
                
                reader.onerror = function (evt) {
                    uploadProgressbar((i+1)*step)
                                            
                    let a = $('<a href="#" class="list-group-item list-group-item-danger"><span class="badge alert-danger pull-right">'+ (++fileCount) +'</span> '+files[i].name+' </a>')
                    let x = $('<i class="fas fa-trash" style="text-align: center; float: right"></i>')
                    x.click(function(){
                        a.remove();
                    });

                    let status = $('<span class="badge alert-danger pull-right" style="float: right; margin-right: 10px"> Error loading</span>')
                    a.append(x, status)
                    $("#processed-files-list").append(a)
                }
            }
        }

    }

    uploadForm.addEventListener('submit', function(e) {
        var uploadFiles = document.getElementById('js-upload-files').files;
        e.preventDefault()
        startUpload(uploadFiles)
    })

    dropZone.ondrop = function(e) {
        e.preventDefault();
        this.className = 'upload-drop-zone';
        startUpload(e.dataTransfer.files)
    }

    dropZone.ondragover = function() {
        this.className = 'upload-drop-zone drop';
        return false;
    }

    dropZone.ondragleave = function() {
        this.className = 'upload-drop-zone';
        return false;
    }
}(jQuery);


function setupDataForTable(metricsData){
    
    let json = [];

    for (let key in metricsData) {

        if (metricsData[key].count > 0){
            json.push({
                name: key.toUpperCase(),
                value: metricsData[key].count
            });
        }
    }

    return json;
}