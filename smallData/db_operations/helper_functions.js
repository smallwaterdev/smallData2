const EventEmitter = require('events');


///////////////////////////////////////////////////////////////////
////////////////// helper functions start ////////////////////////
///////////////////////////////////////////////////////////////////


/**
 * A scheduler function that start #numWorker workers to run the task function:
 * @argument arr A array of Item that is the input of the task
 * @argument numWorker Specify the number of workers
 * @argument task A function that takes an Item as input and a callback function
 * @argument callback A callback will be trigger when all task are done.
 * 
 * The task function's callback argument task an optional error as input. Error message will be 
 * record in an array, and gives to the final callback function.
 * The callback argument task an object input {success: true|false, [reason:[string]]}
 */
function scheduler(arr, numWorker, task, callback){
    const sche = new EventEmitter();
    let error_message = [];
    let worker_counter = 0;
    sche.once('done', ()=>{
        if(error_message.length === 0){
            callback({success: true, reasons:[]});
        }else{
            callback({success: false, reasons: error_message});
        }
    });

    sche.on('worker_complete', ()=>{
        worker_counter ++;
        if(worker_counter === numWorker){
            sche.emit('done');
        }
    });

    sche.on('next', (i)=>{
        if(i >= arr.length){
            sche.emit('worker_complete');
        }else{
            task(arr[i], (err_or_result)=>{
                if(err_or_result){
                    if(typeof err_or_result.message === 'string'){
                        // err
                        error_message.push(err_or_result.message);
                    }else if(err_or_result.success === false && err_or_result.reasons){
                        error_message = error_message.concat(err_or_result.reasons);
                    }  
                }
                sche.emit('next', i+numWorker);
            }); 
        }
    });

    let temp_i = 0;
    while(temp_i < numWorker){
        sche.emit('next', temp_i);
        temp_i++;
    }
}


/////////////////////////////////////////////////////////

function string2NonNegative(value){
    if(typeof value === 'number'){
        return value;
    }
    num = parseInt(value);
    if(value !== num.toString()){
        return -1;
    }else if(num >= 0){
        return num;
    }else{
        // NaN or negative
        return -1;
    }

}

function mergeResults(result_array){
    let success = true;
    let reasons = [];
    let values = [];
    result_array.forEach(ele=>{
        if(ele.success){
            if(ele.value){
                values.push(ele.value);
            }
        }else{
            success = false;
            reasons = reasons.concat(ele.reasons);
        }
    });
    if(values.length > 0){
        return {success: success, reasons: reasons, value: values};
    }else{
        return {success: success, reasons: reasons};
    }
}
module.exports.mergeResults = mergeResults;
module.exports.string2NonNegative = string2NonNegative;
module.exports.scheduler = scheduler;
///////////////////////////////////////////////////////////////////
////////////////////// helper function end /////////////////////////
///////////////////////////////////////////////////////////////////
