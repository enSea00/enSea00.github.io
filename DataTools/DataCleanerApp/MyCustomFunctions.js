///////////////////////////////////////////////////////////////////////////////
//
// MyCustomFunctions.js
// nc, feb, 2023
//
// List of Functions
//      arr_cumulative = cumulative(arr) : computes cumulative total of an array
//      yint = linearInterpolate(x, y, xint) : linear interpolation
//      arr = createIntervalArray(start, stop, interval) : creates fixed interval array
//      result = diff(array) : creates array of differences, ie arr[i+1] - arr[i]
//      [result, indices] = getUniqueWithLastOccurrence(array) : used to treat duplicates, returns array and indices of unique values based on the 'last' of the duplicate values
//      x,y = sortAscending(x,y) : sorts a 2D array based on sorting x in ascending order
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
function cumulative(arr){
    var arr_cumulative = [0]
    for (var i=1; i < arr.length; i++) {
            var inc = arr[i] - arr[i-1];
            if (inc < 0) {inc=0} // this catches rain gauge resets
            arr_cumulative[i] = arr_cumulative[i-1] + inc;  
            }
    return arr_cumulative
    }

///////////////////////////////////////////////////////////////////////////////
function linearInterpolate(x, y, xint) {
    var yint = [];
    for (var i = 0; i < xint.length; i++) {
        var x1, x2, y1, y2;
        for (var j = 0; j < x.length-1; j++) {
            x1 = x[j];
            x2 = x[j + 1];
            if (xint[i] >= x1 && xint[i] <= x2) {
                y1 = y[j];
                y2 = y[j + 1];
                yint.push(y1 + (y2 - y1) * (xint[i] - x1) / (x2 - x1));
                break;
                }
            }
        }
    return yint;
    }

///////////////////////////////////////////////////////////////////////////////
function createIntervalArray(start, stop, interval) {

    const arr = [];
    for (let i = start; i <= stop; i += interval) {
        arr.push(i);
    }
    return arr;
}



///////////////////////////////////////////////////////////////////////////////
function getUniqueWithLastOccurrence(array) {
  let result = [];
  let indices = [];
  let indexMap = new Map();
  for (let i = array.length - 1; i >= 0; i--) {
    if (!indexMap.has(array[i])) {
      indexMap.set(array[i], i);
      result.unshift(array[i]);
      indices.unshift(i);
    }
  }
  return [result, indices];
}

///////////////////////////////////////////////////////////////////////////////
function subsetArray(array,indices){
    var subset = indices.map(function(index) {
        return array[index];
    });
    return subset            
    }

///////////////////////////////////////////////////////////////////////////////
function diff(array) {
    var result = [];
    for (var i = 1; i < array.length; i++) {
        result.push(array[i] - array[i-1]);
        }
    return result;
    }
    
///////////////////////////////////////////////////////////////////////////////
function ComputeDailyRainfall(DateTime, Cumulative){

    // interpolate cumulative data onto a daily time interval
    var start_day = Math.ceil(DateTime[0] / 24/3600000) * 24*3600000 + 9*3600*1000; // start = nearest first day 00:00 + 9 hours to start at 9am as per SILO
    var end_day = Math.ceil(DateTime[DateTime.length-2] / 24/3600000) * 24*3600000 + 9*3600*1000; // end = nearest last day XX:00, length-2 to ensure we get a last 9am
    let DateTime_Daily = createIntervalArray(start_day, end_day, 24*3600000);
    let Cumulative_Daily = linearInterpolate(DateTime, Cumulative, DateTime_Daily);
    
    // compute daily amount
    let Daily = diff(Cumulative_Daily);
    
    // trim out arrays
    DateTime_Daily = DateTime_Daily.slice(1,DateTime_Daily.length-1)
    Cumulative_Daily = Cumulative_Daily.slice(1,Cumulative_Daily.length)
    
    //console.log(DateTime_Daily, Cumulative_Daily, Daily)
    
    return [DateTime_Daily, Cumulative_Daily, Daily]
}

///////////////////////////////////////////////////////////////////////////////
function ComputeIncrementalRainfall(DateTime, Cumulative, dt_interp){

    dt_interp = dt_interp/60 // convert from input minutes to hours for function
    
    // interpolate cumulative data onto a daily time interval
    var start_day = Math.ceil(DateTime[0] / dt_interp/3600000) * dt_interp*3600000; // start = nearest first day 00:00 + 9 hours to start at 9am as per SILO
    var end_day = Math.floor(DateTime[DateTime.length-2] / dt_interp/3600000) * dt_interp*3600000; // end = nearest last day XX:00, length-2 to ensure we get a last 9am
    let DateTime_Interp = createIntervalArray(start_day, end_day, dt_interp*3600000);
    let Cumulative_Interp = linearInterpolate(DateTime, Cumulative, DateTime_Interp);
    
    // compute daily amount
    let Incremental = diff(Cumulative_Interp);
    
    // trim out arrays
    DateTime_Interp = DateTime_Interp.slice(1,DateTime_Interp.length)
    Cumulative_Interp = Cumulative_Interp.slice(1,Cumulative_Interp.length)

    //console.log(DateTime_Interp, Cumulative_Interp, Incremental)
    
    return [DateTime_Interp, Cumulative_Interp, Incremental]
}

///////////////////////////////////////////////////////////////////////////////