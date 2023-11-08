# -*- coding: utf-8 -*-
"""
Created on Sat Feb  4 14:11:37 2023

@author: s2154294
"""
#%%
from bokeh.models import ColumnDataSource, Button, CustomJS, BoxSelectTool, HoverTool, Div, Label, Legend
from bokeh.models import WheelZoomTool, BoxZoomTool, DatetimeTickFormatter, FileInput, TextInput
from bokeh.plotting import figure, show
from bokeh.io import save, output_file, curdoc
from bokeh.layouts import row, column, layout
from bokeh.themes import Theme

from datetime import datetime, timedelta 
import pandas as pd
import numpy as np

#%%#################################################################################################################################################################################
####################################################################################################################################################################################
#
# Globals
#
####################################################################################################################################################################################
####################################################################################################################################################################################

def LoadGlobalParameters():
    
    
    global plot_tools, widthTimeSeriesPlots, heightTimeSeriesPlots, line_width
    plot_tools = 'pan, box_zoom, wheel_zoom, reset'
    widthTimeSeriesPlots = 1000
    heightTimeSeriesPlots = 400
    line_width = 2
    
    # for the file conversion app ---------------------------------------------
    global source_txt, color_txt, source_converted, color_converted
    source_txt = ColumnDataSource(data=dict(DateTime_Raw=[], Rainfall_Raw=[]))
    color_txt = "#1f77b4" # color used for raw data in plots "#aec7e8"
    source_converted = ColumnDataSource(data=dict(DateTime_Raw=[], Rainfall_Converted = []))
    color_converted = "#1f77b4" # color used for raw data in plots "#aec7e8"


    # for the data cleaning app -----------------------------------------------
    global source_raw, color_raw
    source_raw = ColumnDataSource(data=dict(DateTime_Raw=[], Rainfall_Raw=[]))
    color_raw = "#1f77b4" # color used for raw data in plots "#aec7e8"

    # Bokeh Category20 colors
    # "#1f77b4" blue
    # "#aec7e8" light blue
    # "#ff7f0e" orange
    # "#ffbb78" light orange
    # "#2ca02c" green
    # "#98df8a" light green
    # "#d62728" red
    # "#ff9896" light red
    # "#9467bd"
    # "#c5b0d5"
    # "#8c564b"
    # "#c49c94"
    # "#e377c2"
    # "#f7b6d2"
    # "#7f7f7f"
    # "#c7c7c7"
    # "#bcbd22"
    # "#dbdb8d"
    # "#17becf"
    # "#9edae5"
    
    global source_clean, source_precleaned, color_clean
    source_clean = ColumnDataSource(data=dict(DateTime_Clean=[], Rainfall_Clean=[], Cumulative_Clean=[]))
    source_precleaned = ColumnDataSource(data=dict(DateTime_Clean=[], Rainfall_Clean=[], Cumulative_Clean=[]))
    color_clean = "#ff7f0e" #"#ffbb78"

    global source_daily, source_preinterp, color_daily, color_preinterp, source_info, dt_interp
    source_preinterp = ColumnDataSource(data=dict(DateTime_Clean=[], Cumulative_Clean=[]))
    source_daily = ColumnDataSource(data=dict(DateTime_Daily=[], Cumulative_Daily=[], Daily=[]))
    color_daily = "#98df8a" # color used for raw data in plots "#aec7e8"
    color_preinterp = "#ff7f0e" #"#ffbb78"
    dt_interp = 24

    global source_silo, color_silo
    source_silo = ColumnDataSource(data=dict(DateTime_Silo=[], DailyRainfall_Silo=[]))
    color_silo = "#ff9896"
    

    # for the interpolation app -----------------------------------
    global source_interp, source_preinterp_inc, color_interp, color_preinterp_inc, dt_interp_inc
    source_preinterp_inc = ColumnDataSource(data=dict(DateTime_Input=[], Cumulative_Input=[]))
    source_interp = ColumnDataSource(data=dict(DateTime_Interp=[], Cumulative_Interp=[], Incremental=[], bar_width=[]))
    dt_interp_inc = 1 # default interpolation value (hours)
    
    color_interp = "#98df8a" 
    color_preinterp_inc = "#ff7f0e" #"#ffbb78"
    
    return

LoadGlobalParameters()

#%%#################################################################################################################################################################################
####################################################################################################################################################################################
#
# Data File Conversion App functions
#
####################################################################################################################################################################################
####################################################################################################################################################################################

#%%
def InitialiseFileConversionPlots():

    # add instriction label to middle of plot window
    
    # raw gauge plot    
    global plot_raw, status_label_convert, status_text_convert, plot_converted

    plot_raw = figure(tools=plot_tools, height=heightTimeSeriesPlots, width=widthTimeSeriesPlots, title='')
    plot_raw.xaxis.formatter = DatetimeTickFormatter(minutes='%H:%M %d/%m/%Y', hours='%H:%M %d/%m/%Y', days='%H:%M %d/%m/%Y', months='%d/%m/%Y', years='%d/%m/%Y')
    plot_raw.yaxis.axis_label = "Raw Gauge Data"
    plot_raw.toolbar.active_scroll = plot_raw.select_one(WheelZoomTool)
    plot_raw.toolbar.active_drag = plot_raw.select_one(BoxZoomTool)
    plot_raw.toolbar.logo = None
    
    # initialise empty source_raw and plot
    plot_raw.add_layout(Legend(), 'right')
    line_load = plot_raw.line('DateTime_Raw','Rainfall_Raw', source=source_txt, line_width = line_width, line_color=color_txt, legend_label='Rainfall_Raw')
    tooltips=[('Date Time', '@DateTime_Raw{%H:%M %d/%m/%Y}'),
              ('Rainfall_Raw', '@Rainfall_Raw')]
    plot_raw.add_tools(HoverTool(tooltips=tooltips, formatters={'@DateTime_Raw' : 'datetime'}, renderers=[line_load]))
    
    # status label
    status_label_convert = Label(x=int(widthTimeSeriesPlots/3), y=int(heightTimeSeriesPlots/2), x_units='screen', y_units='screen',
                 text='Waiting for file input.', text_font_size='30px', text_align="center")
    plot_raw.add_layout(status_label_convert)
    
    # status_text
    status_text_convert = TextInput(value="Waiting for file input.", width = 400, title="Status:")
    
    # converted data ------------------------
    plot_converted = figure(tools=plot_tools, height=heightTimeSeriesPlots, width=widthTimeSeriesPlots, title='', x_range = plot_raw.x_range)
    plot_converted.xaxis.formatter = DatetimeTickFormatter(minutes='%H:%M %d/%m/%Y', hours='%H:%M %d/%m/%Y', days='%H:%M %d/%m/%Y', months='%d/%m/%Y', years='%d/%m/%Y')
    plot_converted.yaxis.axis_label = "Adjusted Gauge Data"
    plot_converted.toolbar.active_scroll = plot_converted.select_one(WheelZoomTool)
    plot_converted.toolbar.active_drag = plot_converted.select_one(BoxZoomTool)
    plot_converted.toolbar.logo = None
    
    # initialise empty source_raw and plot
    plot_converted.add_layout(Legend(), 'right')
    line_converted = plot_converted.line('DateTime_Raw','Rainfall_Converted', source=source_converted, line_width = line_width, line_color=color_converted, legend_label='Rainfall_Converted')
    tooltips=[('Date Time', '@DateTime_Raw{%H:%M %d/%m/%Y}'),
              ('Rainfall_Converted', '@Rainfall_Converted')]
    plot_converted.add_tools(HoverTool(tooltips=tooltips, formatters={'@DateTime_Raw' : 'datetime'}, renderers=[line_converted]))
    
    return plot_raw, status_label_convert, status_text_convert, plot_converted
    
#%%

def RawDataFileConversion():

    file_input_convert = FileInput(accept=".txt", width=400)
    
    load_data_callback = CustomJS(args=dict(source_txt = source_txt,
                                            status_text_convert = status_text_convert, 
                                            status_label_convert = status_label_convert,
                                            file_input_convert = file_input_convert,
                                            plot_raw = plot_raw,
                                            plot_converted = plot_converted,
                                            source_converted = source_converted), 
        
         code="""

        function StatusTextLoading(){
            status_text_convert.value = 'Loading data ...'
            status_label_convert.text = 'Loading data ...'
            }
        
        function StatusTextComplete(){
            status_text_convert.value = 'File import complete.'    
            status_label_convert.text = ' '
            }

        // file processing ////////////////////////////////////////////////////
        function process_file() {

            var file_contents = cb_obj.value;
            
            // read in entire file and decode text
            const decoded_file_contents = atob(file_contents);
            const file_lines = decoded_file_contents.split("\\n");
            
            // initialise arrays        
            var DateTime_Raw = [];
            var Rainfall_Raw = [];
            
            // read the file data line by line   //////////////////////////////////
            for (var i = 0; i < file_lines.length; i++) {
                
                // read a line
                var line = file_lines[i]
                
                // skip unwanted mid file headers    
                if (line.indexOf('------') !== -1) {continue}
                if (line.indexOf('Station') !== -1) {continue}
                if (line.indexOf('Number') !== -1) {continue}
                if (line.indexOf('rows selected') !== -1) {continue}
                if (line.trim().length === 0 || line.trim() === "") {continue}
                
                // get the time series data
                var tmp = line.split(' ')
                var date = tmp[tmp.length-2]
                var time = tmp[tmp.length-3]
                var rain = parseFloat(tmp[tmp.length-4])
                // this catches case where raw data column is empty in the current row
                if (isNaN(rain)) {
                    rain = parseFloat(tmp[tmp.length-5]); // get data from adjacent column
                    if (isNaN(rain)) {continue}
                    }
                
                // keep the data
                Rainfall_Raw.push(rain);
                
                // parse Date
                var tmp = date.split('-')
                var year = tmp[2];
                var month = tmp[1];
                var day = tmp[0];

                // parse time
                var tmp = time.split(':')
                var hours = tmp[0]
                var minutes = tmp[1]
                
                // make DateTime
                var tmp = new Date(year, month - 1, day, hours, minutes);
                tmp = Math.floor(tmp.getTime()) // unix timestamp
                DateTime_Raw.push(tmp)
                
                } // end of line by line loop

            // reverse order because .txt is most recent to oldest
            DateTime_Raw = DateTime_Raw.reverse()
            Rainfall_Raw = Rainfall_Raw.reverse()

            // update data source
            source_txt.data = {DateTime_Raw: DateTime_Raw, Rainfall_Raw: Rainfall_Raw}; 
            source_txt.change.emit();

            //
            var data = source_txt.data;
            var x = data['DateTime_Raw'];
            var y = data['Rainfall_Raw'];
            
            // save csv file
            var csv_data = 'DateTime, Rainfall\\n';
            for (var i = 0; i < x.length; i++) {
                var date = new Date(x[i]);
                var formatted_timestamp = date.toLocaleDateString() + " " + date.toLocaleTimeString();
                csv_data += formatted_timestamp + ',' + y[i] + '\\n';
            }
            
            var blob = new Blob([csv_data], { type: 'text/csv;charset=utf-8;' });
            var link = document.createElement("a");
            if (link.download !== undefined) {
                link.setAttribute("href", window.URL.createObjectURL(blob));
                var csvFile = file_input_convert.filename.slice(0,file_input_convert.filename.length-4)+'.csv'
                link.setAttribute("download", csvFile);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
        }  // end of proces_file function
    
        function CallbackTiming(){
            setTimeout(StatusTextLoading,0);
            plot_raw.title.text = file_input_convert.filename;
            setTimeout(process_file, 1000);
            setTimeout(StatusTextComplete, 1000);
            
            }
    
        CallbackTiming()
        
    """)

    # Create a FileInput widget
    file_input_convert.js_on_change("value", load_data_callback)
    
    return file_input_convert

#%% #################################################################################################################################################################################
#####################################################################################################################################################################################
#
# Data Cleaner App functions
#
####################################################################################################################################################################################
####################################################################################################################################################################################

#%% initialise plot

def InitialiseDataCleanerPlots():

    # add instriction label to middle of plot window
    
    # raw gauge plot ----------------------------------------------------------    
    global plot_cleaner, plot_Daily_cleaner
    global status_label_cleaner, status_text_cleaner, status_label_cleaner_silo, status_text_cleaner_silo

    plot_cleaner = figure(tools=plot_tools, height=heightTimeSeriesPlots, width=widthTimeSeriesPlots, title=' ')
    plot_cleaner.xaxis.formatter = DatetimeTickFormatter(minutes='%H:%M %d/%m/%Y', hours='%H:%M %d/%m/%Y', days='%H:%M %d/%m/%Y', months='%d/%m/%Y', years='%d/%m/%Y')
    plot_cleaner.yaxis.axis_label = "Raw Gauge Data"
    
    plot_cleaner.toolbar.active_scroll = plot_cleaner.select_one(WheelZoomTool)
    plot_cleaner.toolbar.active_drag = plot_cleaner.select_one(BoxZoomTool)
    plot_cleaner.toolbar.logo = None
    
    # initialise empty source_raw and plot
    plot_cleaner.add_layout(Legend(), 'right')
    line_raw = plot_cleaner.line('DateTime_Raw','Rainfall_Raw', source=source_raw, line_color=color_raw, line_width = line_width, legend_label='Rainfall_Raw')
    tooltips=[('Date Time', '@DateTime_Raw{%H:%M %d/%m/%Y}'),
              ('Rainfall_Raw', '@Rainfall_Raw')]
    plot_cleaner.add_tools(HoverTool(tooltips=tooltips, formatters={'@DateTime_Raw' : 'datetime'}, renderers=[line_raw]))
    
    # add cleaned data
    points_clean = plot_cleaner.circle('DateTime_Clean', 'Rainfall_Clean', color=color_clean, fill_alpha = 0, source=source_clean, legend_label='Rainfall_Clean')
    tooltips=[('Date Time', '@DateTime_Clean{%H:%M %d/%m/%Y}'),
              ('Rainfall_Clean', '@Rainfall_Clean')]
    plot_cleaner.add_tools(HoverTool(tooltips=tooltips, formatters={'@DateTime_Clean' : 'datetime'}, renderers=[points_clean]))
    
    # add selection box tool for "clean" cds
    tool_BoxSelect = BoxSelectTool(renderers=[points_clean])
    plot_cleaner.add_tools(tool_BoxSelect)
    plot_cleaner.legend.click_policy = 'hide'
    
    # status label
    status_label_cleaner = Label(x=int(widthTimeSeriesPlots/3), y=int(heightTimeSeriesPlots/2), x_units='screen', y_units='screen',
                 text='Waiting for file input.', text_font_size='30px', text_align="center")
    plot_cleaner.add_layout(status_label_cleaner)

    # status text box
    status_text_cleaner = TextInput(value="Waiting for file input.", width = 400, title="Status:")
    
    # cumulative plot ---------------------------------------------------------
    plot_cumulative_cleaner = figure(height=int(0.5*heightTimeSeriesPlots), width=widthTimeSeriesPlots, x_range=plot_cleaner.x_range, tools=plot_tools)
    plot_cumulative_cleaner.xaxis.formatter = DatetimeTickFormatter(minutes='%H:%M %d/%m/%Y',hours='%H:%M %d/%m/%Y',days='%H:%M %d/%m/%Y',months='%d/%m/%Y',years='%d/%m/%Y')
    plot_cumulative_cleaner.yaxis.axis_label = "Cumulative Rainfall"
    
    plot_cumulative_cleaner.toolbar.active_scroll = plot_cumulative_cleaner.select_one(WheelZoomTool)
    plot_cumulative_cleaner.toolbar.active_drag = plot_cumulative_cleaner.select_one(BoxZoomTool)
    plot_cumulative_cleaner.toolbar.logo = None
    
    plot_cumulative_cleaner.add_layout(Legend(), 'right')
    line_cumulative = plot_cumulative_cleaner.line('DateTime_Clean','Cumulative_Clean', source=source_clean, line_color=color_clean, line_width = line_width, legend_label='Cumulative_Clean')
    tooltips=[('Date Time', '@DateTime_Clean{%H:%M %d/%m/%Y}'),
              ('Cumulative_Clean', '@Cumulative_Clean{0.1f}')]
    plot_cumulative_cleaner.add_tools(HoverTool(tooltips=tooltips, formatters={'@DateTime_Clean' : 'datetime'}, renderers=[line_cumulative]))

    line_Cumulative_Daily = plot_cumulative_cleaner.line('DateTime_Daily','Cumulative_Daily', source=source_daily, line_color=color_daily, line_width = line_width, legend_label='Cumulative_Daily')
    tooltips=[('Date Time', '@DateTime_Daily{%H:%M %d/%m/%Y}'),
              ('Cumulative_Daily', '@Cumulative_Daily{0.1f}')]
    plot_cumulative_cleaner.add_tools(HoverTool(tooltips=tooltips, formatters={'@DateTime_Daily' : 'datetime'}, renderers=[line_Cumulative_Daily]))
    plot_cumulative_cleaner.legend.click_policy = 'hide'
    
    # daily rainfall plot ---------------------------------------------------
    plot_Daily_cleaner = figure(height=int(0.5*heightTimeSeriesPlots), width=widthTimeSeriesPlots, title = ' ', x_range=plot_cleaner.x_range, tools=plot_tools,)
    plot_Daily_cleaner.xaxis.formatter = DatetimeTickFormatter(minutes='%H:%M %d/%m/%Y',hours='%H:%M %d/%m/%Y',days='%H:%M %d/%m/%Y',months='%d/%m/%Y',years='%d/%m/%Y')
    plot_Daily_cleaner.yaxis.axis_label = 'Daily'
    
    plot_Daily_cleaner.toolbar.active_scroll = plot_Daily_cleaner.select_one(WheelZoomTool)
    plot_Daily_cleaner.toolbar.active_drag = plot_Daily_cleaner.select_one(BoxZoomTool)
    plot_Daily_cleaner.toolbar.logo = None

    plot_Daily_cleaner.add_layout(Legend(), 'right')
    # SILO    
    plot_cumulative_cleaner.add_layout(Legend(), 'right')
    bar_Daily_Silo = plot_Daily_cleaner.vbar(x='DateTime_Silo', top='DailyRainfall_Silo', width=timedelta(hours=24), fill_color=color_silo, fill_alpha = 0.2, line_color=color_silo, source=source_silo, legend_label='Daily_SILO')
    tooltips=[('Date Time', '@DateTime_Silo{%H:%M %d/%m/%Y}'),
              ('DailyRainfall_Silo', '@DailyRainfall_Silo{0.2f}')]
    plot_Daily_cleaner.add_tools(HoverTool(tooltips=tooltips, formatters={'@DateTime_Silo' : 'datetime'}, renderers=[bar_Daily_Silo]))
    plot_Daily_cleaner.legend.click_policy = 'hide'

    # status label
    status_label_cleaner_silo = Label(x=int(widthTimeSeriesPlots/3), y=int(0.5*heightTimeSeriesPlots/2), x_units='screen', y_units='screen',
                 text='Waiting for SILO file input.', text_font_size='30px', text_align="center")
    plot_Daily_cleaner.add_layout(status_label_cleaner_silo)

    # status text box
    status_text_cleaner_silo = TextInput(value="Waiting for SILO file input.", width = 400, title="Status:")

    # Interpolated to estimate daily
    bar_Daily = plot_Daily_cleaner.vbar(x='DateTime_Daily', top='Daily', width=timedelta(hours=dt_interp), fill_color=color_daily, line_color=color_daily, fill_alpha = 0.2, source=source_daily, legend_label='Daily_Interp')
    tooltips=[('Date Time', '@DateTime_Daily{%H:%M %d/%m/%Y}'),
              ('Daily_Interp', '@Daily{0.2f}')]
    plot_Daily_cleaner.add_tools(HoverTool(tooltips=tooltips, formatters={'@DateTime_Daily' : 'datetime'}, renderers=[bar_Daily]))

    
    return plot_cleaner, plot_cumulative_cleaner, plot_Daily_cleaner, status_label_cleaner, status_text_cleaner

#%% load raw csv file 

def csvDataFileInput():
    
    # two columns [DateTime, Rainfall_Raw]
    global csvfile_input
    
    csvfile_input = FileInput(accept=".csv",width=400)
    

    load_csvdata_callback = CustomJS(args=dict(source_raw=source_raw,
                                               source_clean=source_clean,
                                               source_precleaned=source_precleaned,
                                               source_daily = source_daily, 
                                               status_text_cleaner = status_text_cleaner,
                                               status_label_cleaner = status_label_cleaner,
                                               csvfile_input=csvfile_input,
                                               plot_cleaner = plot_cleaner,
                                               ), 
        
          code="""
    
        function StatusTextLoading(){
            status_text_cleaner.value = 'Loading raw data file and pre-cleaning data ...'
            status_label_cleaner.text = 'Loading raw data file and pre-cleaning data ...'
            }
        
        function StatusTextComplete(){
            status_text_cleaner.value = 'File import and pre-cleaning complete.'    
            status_label_cleaner.text = ' '
            }
    
    
        // file loading ////////////////////////////////////////////////////
        function process_file() {
    
            var file_contents = cb_obj.value;
            
            // read in entire file and decode text
            const decoded_file_contents = atob(file_contents);
            const file_lines = decoded_file_contents.split("\\n");
            
            // initialise arrays        
            var DateTime_Raw = [];
            var Rainfall_Raw = [];
            
            // read the file data line by line   //////////////////////////////////
            for (var i = 1; i < file_lines.length; i++) {
                
                // read a line
                var line = file_lines[i]
                
                // checks
                if (line.trim().length === 0 || line.trim() === "") {continue}
                
                // get the time series data
                var tmp = line.split(',')

                var rain = parseFloat(tmp[1])
                Rainfall_Raw.push(rain);

                // parse date time
                // tmp[0] = 4/07/2005 9:33
                var datetime_string = tmp[0];
                var date_parts = datetime_string.split(" ")[0].split("/");
                var time_parts = datetime_string.split(" ")[1].split(":");
                var datetime = new Date(date_parts[2], date_parts[1] - 1, date_parts[0], time_parts[0], time_parts[1]);
                datetime = Math.floor(datetime.getTime()) // unix timestamp
                DateTime_Raw.push(datetime)
                
                } // end of line by line loop
    
            // create data source
            source_raw.data = {DateTime_Raw: DateTime_Raw, Rainfall_Raw: Rainfall_Raw}; 
            source_raw.change.emit();

            // automatic pre-cleaning to remove obvious anomalies /////////////////////////////
            console.log('  Pre-clean data ...')
            const inc_threshold = 2 //mm
            const intensity_threshold = 200 // mm/hr
            var DateTime_Clean = []
            var Data_Clean = []
            for (var ii=1; ii<Rainfall_Raw.length-1; ii++){  // so note that the first and last values of raw data are dropped
               
                // get rainfall increment
                const inc_back = Rainfall_Raw[ii] - Rainfall_Raw[ii-1]
                const inc_forward = Rainfall_Raw[ii] - Rainfall_Raw[ii+1]
                
                // catch anomalous intensity
                const inc_time = DateTime_Raw[ii+1]/3600000 - DateTime_Raw[ii]/3600000
                const intensity = -inc_forward/inc_time
                if (intensity > intensity_threshold) {console.log('here33')
                                                      console.log(DateTime_Raw[ii+1], intensity_threshold, intensity)
                                                      continue}
                
    
                //catch up down anomaly above trend
                if (inc_back > inc_threshold && inc_forward > inc_threshold) {continue}
    
                // catch down up anomaly below trend
                if (inc_back < -inc_threshold && inc_forward < -inc_threshold) {continue}
    
                // keep good data
                DateTime_Clean.push(DateTime_Raw[ii])
                Data_Clean.push(Rainfall_Raw[ii])
                
                } // end of ii for loop
    
            // remove non-unique values - keeps last occurrence ///////////////////
            let numbers = DateTime_Clean; 
            let [uniqueWithLastOccurrence, indices] = getUniqueWithLastOccurrence(numbers);
            DateTime_Clean = subsetArray(DateTime_Clean,indices)
            Data_Clean = subsetArray(Data_Clean,indices)
            
            // compute cumulative /////////////////////////////////////////////////
            var Cumulative_Clean = cumulative(Data_Clean)
    
            // update sources /////////////////////////////////////////////////////
            source_clean.data = {DateTime_Clean: DateTime_Clean, Rainfall_Clean: Data_Clean, Cumulative_Clean: Cumulative_Clean};
            source_clean.change.emit();
            source_precleaned.data = source_clean.data;
            source_precleaned.change.emit();
    
           /////////////////////////////////////////////////////////////////////////             
            // compute daily accumulations via interpolation of curve
            // day is to 9am, consistent with SILO
            let [DateTime_Daily, Cumulative_Daily, Daily]  = ComputeDailyRainfall(DateTime_Clean, Cumulative_Clean);
            
            // update source_daily
            source_daily.data = {DateTime_Daily: DateTime_Daily, Cumulative_Daily: Cumulative_Daily, Daily: Daily}; 
            source_daily.change.emit();
            
        }  // end of process_file function
    
        function CallbackTiming(){
            setTimeout(StatusTextLoading,0);
            plot_cleaner.title.text = csvfile_input.filename;
            setTimeout(process_file, 1000);
            setTimeout(StatusTextComplete, 1000);
            }
        
        CallbackTiming()
        
    """)
    
    csvfile_input.js_on_change("value", load_csvdata_callback)
    
    return csvfile_input


#%%
def siloDataFileInput():
    
    # two columns [DateTime, Rainfall_Raw]
    global SILOfile_input
    
    SILOfile_input = FileInput(accept=".txt",width=400)
    

    load_SILOdata_callback = CustomJS(args=dict(source_silo = source_silo,
                                                status_text_cleaner_silo = status_text_cleaner_silo,
                                                status_label_cleaner_silo = status_label_cleaner_silo, 
                                                plot_Daily_cleaner = plot_Daily_cleaner,
                                                SILOfile_input = SILOfile_input,
                                               ), 
        
          code="""
    
        function StatusTextLoading(){
            status_text_cleaner_silo.value = 'Loading SILO ref data file ...'
            status_label_cleaner_silo.text = 'Loading SILO ref data file ...'
            }
        
        function StatusTextComplete(){
            status_text_cleaner_silo.value = 'SILO File import and pre-cleaning complete.'    
            status_label_cleaner_silo.text = ' '
            }
    
    
        // file loading ////////////////////////////////////////////////////
        function process_file() {
    
            var file_contents = cb_obj.value;
            
            // read in entire file and decode text
            const decoded_file_contents = atob(file_contents);
            const file_lines = decoded_file_contents.split("\\n");
            
            // initialise arrays        
            var DateTime_Silo = [];
            var DailyRainfall_Silo = [];
            
            // read the file data line by line   //////////////////////////////////
            console.log('  Read file line by line ...')
            for (var i = 1; i < file_lines.length; i++) {
            //for (var i = 0; i < 20; i++) {
                
                // read a line
                var line = file_lines[i]
                line = line.replace('\\r','')
                // SILO line format 2010  1  1    1      2.6
                //                  2021 12 31  365      2.6
                
                // checks
                if (line.trim().length === 0 || line.trim() === "") {continue}
                
                // get the time series data
                var tmp = line.split(' ')
                tmp = tmp.filter((str) => str !== ''); // remove empty strings in split array
                var rain = parseFloat(tmp[4])
                DailyRainfall_Silo.push(rain);
                
                // make DateTime
                var year = tmp[0];
                var month = tmp[1];
                var day = tmp[2];
                var hours = 19;  // for 9am + 10hrs GMT
                var minutes = 0;
                var tmp = new Date(year, month - 1, day, hours, minutes);
                console.log(tmp)
                tmp = Math.floor(tmp.getTime()); // unix timestamp
                DateTime_Silo.push(tmp)

                } // end of line by line loop
    
            // create data source
            source_silo.data = {DateTime_Silo: DateTime_Silo, DailyRainfall_Silo: DailyRainfall_Silo}; 
            source_silo.change.emit();

            
        }  // end of process_file function
    
        function CallbackTiming(){
            setTimeout(StatusTextLoading,0);
            plot_Daily_cleaner.title.text = SILOfile_input.filename;
            setTimeout(process_file, 1000);
            setTimeout(StatusTextComplete, 1000);
            }
        
        CallbackTiming()
        
    """)
    
    SILOfile_input.js_on_change("value", load_SILOdata_callback)
    
    return SILOfile_input

#%% Remove Data button and callback

def makeRemoveDataButton():

    remove_button = Button(label='Delete Selected Points', button_type='danger')
    remove_callback = CustomJS(args={'source_clean': source_clean,
                                     'source_daily' : source_daily,
                                     'status_label_cleaner' : status_label_cleaner,
                                     'status_text_cleaner' : status_text_cleaner,
                                     }, 
                               code="""
                               
        function StatusTextLoading(){
            status_text_cleaner.value = 'Reprocessing data ...'
            status_label_cleaner.text = 'Reprocessing data ...'
            }
        
        function StatusTextComplete(){
            status_text_cleaner.value = 'Data processing complete.'    
            status_label_cleaner.text = ' '
            }

        function processing(){
                                           
            var indices = source_clean.selected.indices;
            if (indices.length == 0) {
                return;
            }
            
            // declare variables        
            var data = source_clean.data;
            var x = data['DateTime_Clean'];
            var y = data['Rainfall_Clean'];
            var removed_x = [];
            var removed_y = [];
            
            // remove data and store for later recovery
            for (var i = 0; i < indices.length; i++) {
                removed_x.push(x[indices[i]]);
                removed_y.push(y[indices[i]]);
            }
            window.removed_data = {'x': removed_x, 'y': removed_y};
            
            
            var new_x = [];
            var new_y = [];
            for (var i = 0; i < x.length; i++) {
                if (indices.indexOf(i) == -1) {
                    new_x.push(x[i]);
                    new_y.push(y[i]);
                }
            }
            
            // compute cumulative total
            var new_c = cumulative(new_y)
            source_clean.data = {'DateTime_Clean': new_x, 'Rainfall_Clean': new_y, 'Cumulative_Clean':new_c};
            source_clean.selected.indices = [];
            
            // 

            // ComputeDaily(source_clean, source_daily)
            let [DateTime_Daily, Cumulative_Daily, Daily]  = ComputeDailyRainfall(new_x, new_c);
            
            // update source_daily
            source_daily.data = {DateTime_Daily: DateTime_Daily, Cumulative_Daily: Cumulative_Daily, Daily: Daily}; 
            source_daily.change.emit();
            

            } // end of processing function

        function CallbackTiming(){
            setTimeout(StatusTextLoading,0);
            setTimeout(processing, 1000);
            setTimeout(StatusTextComplete, 1000);
            }
    
        CallbackTiming()

        
    """)
    remove_button.js_on_click(remove_callback)

    return remove_button

# trying to work out how to embed custom function for use without copying into each js callback???

#%%

def makeUndoLastButton():
    undo_button = Button(label='Undo Last Delete', button_type='warning')
    undo_callback = CustomJS(args={'source_clean': source_clean,
                                   'source_daily': source_daily,
                                   'status_label_cleaner' : status_label_cleaner,
                                   'status_text_cleaner' : status_text_cleaner,

                                   }, code="""

        function StatusTextLoading(){
            status_text_cleaner.value = 'Undoing last delete ...'
            status_label_cleaner.text = 'Undoing last delete ...'
            }
        
        function StatusTextComplete(){
            status_text_cleaner.value = 'Data processing complete.'    
            status_label_cleaner.text = ' '
            }


        function processing(){
            
            var data = source_clean.data;
            var x = data['DateTime_Clean'];
            var y = data['Rainfall_Clean'];
            
            var removed_x = window.removed_data['x'];
            var removed_y = window.removed_data['y'];
            
            x = x.concat(removed_x); // this puts removed data at the end so need to sort!!
            y = y.concat(removed_y);
            
            // sort data based on x (time)
            let combined = [];
            for (let i = 0; i < y.length; i++) {
              combined.push({ y: y[i], x: x[i] });
            }
            combined.sort((a, b) => a.x - b.x);
            y = combined.map(point => point.y);
            x = combined.map(point => point.x);
            
            // recompute cumulative total
            var c = cumulative(y)
            source_clean.data = {'DateTime_Clean': x, 'Rainfall_Clean': y, 'Cumulative_Clean': c};
            
            // 
            ComputeDaily(source_clean, source_daily)
    
            window.removed_data = null;
            }
        
        function CallbackTiming(){
            setTimeout(StatusTextLoading,0);
            setTimeout(processing, 1000);
            setTimeout(StatusTextComplete, 1000);
            }
    
        CallbackTiming()
    """)
    undo_button.js_on_click(undo_callback)
    
    return undo_button 

#%%

def makeRestoreToPrecleanedDataButton():
    
    restore_button = Button(label='Restore to Pre-Cleaned Data', button_type='primary')
    
    restore_callback = CustomJS(args={'source_clean': source_clean,
                                      'source_precleaned' : source_precleaned,
                                      'source_daily' : source_daily,
                                      'status_label_cleaner' : status_label_cleaner,
                                      'status_text_cleaner' : status_text_cleaner,
                                      },
                                
                                code="""
                               
                                    function StatusTextLoading(){
                                        status_text_cleaner.value = 'Restoring pre-cleaned data ...'
                                        status_label_cleaner.text = 'Restoring pre-cleaned data ...'
                                        }
                                    
                                    function StatusTextComplete(){
                                        status_text_cleaner.value = 'Pre-cleaned data restored.'    
                                        status_label_cleaner.text = ' '
                                        }
                                    
                                    function processing(){
                                        source_clean.data = source_precleaned.data;
                                        source_clean.change.emit();
                                        ComputeDaily(source_clean, source_daily)
                                            } // end of processing
                                    
                                     function CallbackTiming(){
                                         setTimeout(StatusTextLoading,0);
                                         setTimeout(processing, 1000);
                                         setTimeout(StatusTextComplete, 1000);
                                         }
                                     
                                     CallbackTiming()
                                       
                                     """
                                ) # end of CustomJS
    
    restore_button.js_on_click(restore_callback)
    
    return restore_button

#%%

def makeRestoreToRawDataButton():
    
    raw_button = Button(label='Restore to Raw Data')
    raw_callback = CustomJS(args={'source_clean': source_clean,
                                  'source_raw' : source_raw,
                                  'source_daily' : source_daily,
                                  'status_label_cleaner' : status_label_cleaner,
                                  'status_text_cleaner' : status_text_cleaner,
                              },
                               code="""

                               function StatusTextLoading(){
                                   status_text_cleaner.value = 'Restoring to raw data ...'
                                   status_label_cleaner.text = 'Restoring to raw data ...'
                                   }
                               
                               function StatusTextComplete(){
                                   status_text_cleaner.value = 'Raw data restored.'    
                                   status_label_cleaner.text = ' '
                                   }

                                function processing(){

                                       var data = source_raw.data;
                                       var x = data['DateTime_Raw'];
                                       var y = data['Rainfall_Raw'];
                                       
                                       // sort data based on x (time)
                                       let combined = [];
                                       for (let i = 0; i < y.length; i++) {
                                         combined.push({ y: y[i], x: x[i] });
                                       }
                                       combined.sort((a, b) => a.x - b.x);
                                       y = combined.map(point => point.y);
                                       x = combined.map(point => point.x);
                                       
                                       // recompute cumulative total
                                       var c = cumulative(y);
                                       
                                    // update source
                                    source_clean.data = {DateTime_Clean: x, Rainfall_Clean: y, Cumulative_Clean: c};
                                    source_clean.change.emit();
                                   
                                    // 
                                    ComputeDaily(source_clean, source_daily)
                                    }
                                
                                function CallbackTiming(){
                                    setTimeout(StatusTextLoading,0);
                                    setTimeout(processing, 1000);
                                    setTimeout(StatusTextComplete, 1000);
                                    }
                            
                                CallbackTiming()

                               """)
    raw_button.js_on_click(raw_callback)
    
    return raw_button 

#%%

def makeClearAllDataButton():
    
    clear_all_button = Button(label='Clear All Data')
    clear_all_callback = CustomJS(args={'source_clean': source_clean,
                                        'source_raw' : source_raw,
                                        'source_daily' : source_daily,
                                        'status_label_cleaner' : status_label_cleaner,
                                        'status_text_cleaner' : status_text_cleaner,
                                        'plot_cleaner' : plot_cleaner,
                                        'csvfile_input' : csvfile_input},
                               code="""

                                    // update source
                                    source_clean.data = {DateTime_Clean: [], Rainfall_Clean: [], Cumulative_Clean: []};
                                    source_clean.change.emit();

                                    source_raw.data = {DateTime_Raw: [], Rainfall_Raw: []};
                                    source_raw.change.emit();
                                    
                                    source_daily.data = {DateTime_Daily: [], Cumulative_Daily: [], Daily: []};
                                    source_daily.change.emit();

                                    plot_cleaner.title.text = ' ';

                                   // csvfile_input.value = [ ];
                                   status_text_cleaner.value = 'Waiting for a new file input. \\n To reload the previous file you need to first refresh the page.'
                                   status_label_cleaner.text = 'Waiting for a new file input. \\n To reload the previous file you need to first refresh the page.'
                                   
                                   //var new_file_input = new Bokeh.Models.FileInput({accept: ".csv", id: "file-input" + new Date().getTime()});
                                   //csvfile_input = new_file_input;

                               """)
    clear_all_button.js_on_click(clear_all_callback)

    return clear_all_button

#%%

def makeExportCleanedDataButton():
    
    export_button = Button(label='Export Cleaned Data', button_type='success')
    export_callback = CustomJS(args={'source_clean': source_clean,
                                     'status_label_cleaner' : status_label_cleaner,
                                     'status_text_cleaner' : status_text_cleaner,
                                     'csvfile_input' : csvfile_input, 
                                 },
                                  code="""

                                  function StatusTextLoading(){
                                      status_text_cleaner.value = 'Exporting cleaned data ...'
                                      status_label_cleaner.value = 'Exporting cleaned data ...'
                                      }
                                  
                                  function StatusTextComplete(){
                                      status_text_cleaner.value = 'Data export complete.'    
                                      status_label_cleaner.text = ' '
                                      }

                                   function processing(){
                                        
                                        var data = source_clean.data;
                                        var x = data['DateTime_Clean'];
                                        var y = data['Rainfall_Clean'];
                                        var c = data['Cumulative_Clean'];
                                        
                                
                                        var csv_data = 'DateTime,Cumulative Rainfall\\n';
                                        for (var i = 0; i < x.length; i++) {
                                            var date = new Date(x[i]);
                                            var formatted_timestamp = date.toLocaleDateString() + " " + date.toLocaleTimeString();
                                            csv_data += formatted_timestamp + ',' + c[i] + '\\n';
                                        }
                                        
                                        var blob = new Blob([csv_data], { type: 'text/csv;charset=utf-8;' });
                                        var link = document.createElement("a");
                                        if (link.download !== undefined) {
                                            link.setAttribute("href", window.URL.createObjectURL(blob));
                                            var csvFile = csvfile_input.filename.slice(0,csvfile_input.filename.length-4)+'_Cleaned.csv'
                                            link.setAttribute("download", csvFile);
                                            link.style.visibility = 'hidden';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }                                       
                                        }
                                   
                                   function CallbackTiming(){
                                       setTimeout(StatusTextLoading,0);
                                       setTimeout(processing, 1000);
                                       setTimeout(StatusTextComplete, 1000);
                                       }
                               
                                   CallbackTiming()


    """)
    export_button.js_on_click(export_callback)
    
    return export_button

#%%#################################################################################################################################################################################
####################################################################################################################################################################################
#
# Interpolator App functions
#
####################################################################################################################################################################################
####################################################################################################################################################################################

def InitialiseInterpolatorPlots():
    
    global plot_cumulative_interp, dt_interp_input, plot_incremental, status_label_interp, status_text_interp, status_label_inc, status_text_inc, bar_interp
    
    # cumulative plot ---------------------------------------------------------
    plot_cumulative_interp = figure(height=int(0.7*heightTimeSeriesPlots), width=widthTimeSeriesPlots, tools=plot_tools, title=' ')
    plot_cumulative_interp.xaxis.formatter = DatetimeTickFormatter(minutes='%H:%M %d/%m/%Y',hours='%H:%M %d/%m/%Y',days='%H:%M %d/%m/%Y',months='%d/%m/%Y',years='%d/%m/%Y')
    plot_cumulative_interp.yaxis.axis_label = "Cumulative Rainfall Total"
    
    plot_cumulative_interp.toolbar.active_scroll = plot_cumulative_interp.select_one(WheelZoomTool)
    plot_cumulative_interp.toolbar.active_drag = plot_cumulative_interp.select_one(BoxZoomTool)
    plot_cumulative_interp.toolbar.logo = None
    plot_cumulative_interp.add_layout(Legend(), 'right')
    
    line_cumulative_inc = plot_cumulative_interp.line('DateTime_Input','Cumulative_Input', source = source_preinterp_inc, line_color=color_preinterp, line_width = line_width, legend_label='Cumulative Input')
    line_interp = plot_cumulative_interp.line('DateTime_Interp','Cumulative_Interp', source = source_interp, line_color=color_interp, line_width = line_width, legend_label='Cumulative_Interp')
    
    tooltips=[('Date Time', '@DateTime_Interp{%H:%M %d/%m/%Y}'),
              ('Cumulative_Interp', '@Cumulative_Interp')]
    plot_cumulative_interp.add_tools(HoverTool(tooltips=tooltips, formatters={'@DateTime_Interp' : 'datetime'}, renderers=[line_interp]))
    plot_cumulative_interp.legend.click_policy = 'hide'

    
    # status label
    status_label_interp = Label(x=int(widthTimeSeriesPlots/3), y=int(0.7*heightTimeSeriesPlots/2), x_units='screen', y_units='screen',
                 text='Waiting for file input.', text_font_size='30px', text_align="center")
    plot_cumulative_interp.add_layout(status_label_interp)

    # status text box
    status_text_interp = TextInput(value="Waiting for file input.", width = 400, title="Status:")
    
    # Incremental plot 
    plot_incremental = figure(height=int(1.2*heightTimeSeriesPlots), width=widthTimeSeriesPlots, x_range=plot_cumulative_interp.x_range, tools=plot_tools, title=' ')
    plot_incremental.xaxis.formatter = DatetimeTickFormatter(minutes='%H:%M %d/%m/%Y',hours='%H:%M %d/%m/%Y',days='%H:%M %d/%m/%Y',months='%d/%m/%Y',years='%d/%m/%Y')
    plot_incremental.yaxis.axis_label = 'Incremental'
    
    plot_incremental.toolbar.active_scroll = plot_incremental.select_one(WheelZoomTool)
    plot_incremental.toolbar.active_drag = plot_incremental.select_one(BoxZoomTool)
    plot_incremental.toolbar.logo = None
    
    # dt_interp_inc = 1
    # width=timedelta(hours=dt_interp_inc)
    plot_incremental.add_layout(Legend(), 'right')
    bar_interp = plot_incremental.vbar(x='DateTime_Interp', top='Incremental', width='bar_width', fill_color=color_interp, line_color=color_interp, source=source_interp)
    tooltips=[('Date Time', '@DateTime_Interp{%H:%M %d/%m/%Y}'),
              ('Incremental', '@Incremental')]
    plot_incremental.add_tools(HoverTool(tooltips=tooltips, formatters={'@DateTime_Interp' : 'datetime'}, renderers=[bar_interp]))
    plot_incremental.legend.click_policy = 'hide'


    # status label
    status_label_inc = Label(x=int(widthTimeSeriesPlots/3), y=int(1.2*heightTimeSeriesPlots/2), x_units='screen', y_units='screen',
                 text='Waiting for time interval input.', text_font_size='30px', text_align="center")
    plot_incremental.add_layout(status_label_inc)

    # status text box
    status_text_inc = TextInput(value='Waiting for time interval input.', width = 400, title="Status:")

    
    return plot_cumulative_interp, plot_incremental, status_label_interp, status_text_interp, status_label_inc, status_text_inc, bar_interp

#%%

def cumulativeDataFileInput():
    
    # two columns [DateTime, Rainfall_Raw]
    global cumulativefile_input, cumulativefile_load_button
    
    cumulativefile_input = FileInput(accept=".csv", width=400)
    
    cumulativefile_load_button = Button(label='Load Data') #, button_type='success')

    load_cumulativedata_callback = CustomJS(args=dict(source_preinterp_inc = source_preinterp_inc,
                                                      source_interp = source_interp,
                                                      source_daily = source_daily, 
                                                      
                                                      status_text_interp = status_text_interp,
                                                      status_label_interp = status_label_interp,
                                                      status_text_inc = status_text_inc,
                                                      status_label_inc = status_label_inc,

                                                      cumulativefile_input = cumulativefile_input,
                                                      dt_interp_input = dt_interp_input,
                                                      
                                                      plot_cumulative_interp = plot_cumulative_interp,
                                                      plot_incremental = plot_incremental,
                                                      ), 
        
          code="""
    
        function StatusTextLoading(){
            status_text_interp.value = 'Loading input cumulative rainfall data ...'
            status_label_interp.text = 'Loading input cumulative rainfall data ...'
            }
        
        function StatusTextComplete(){
            status_text_interp.value = 'File import complete.'    
            status_label_interp.text = ' '
            status_text_inc.value = 'Waiting for user\\'s time interval input.'    
            status_label_inc.text = 'Waiting for user\\'s time interval input.'

            }

        // file loading ////////////////////////////////////////////////////
        function process_file() {
    
            //var file_contents = cb_obj.value;  // when using FileInput on change callback
            var file_contents = cumulativefile_input.value;
            
            // read in entire file and decode text
            const decoded_file_contents = atob(file_contents);
            const file_lines = decoded_file_contents.split("\\n");
            
            // initialise arrays        
            var DateTime_Input = [];
            var Cumulative_Input = [];
            
            // read the file data line by line   //////////////////////////////////
            for (var i = 1; i < file_lines.length; i++) {
                
                // read a line
                var line = file_lines[i]
                
                // checks
                if (line.trim().length === 0 || line.trim() === "") {continue}
                
                // get the time series data
                var tmp = line.split(',')

                var rain = parseFloat(tmp[1])
                Cumulative_Input.push(rain);

                // parse date time
                // tmp[0] = 4/07/2005 9:33
                var datetime_string = tmp[0];
                var date_parts = datetime_string.split(" ")[0].split("/");
                var time_parts = datetime_string.split(" ")[1].split(":");
                var datetime = new Date(date_parts[2], date_parts[1] - 1, date_parts[0], time_parts[0], time_parts[1]);
                datetime = Math.floor(datetime.getTime()) // unix timestamp
                DateTime_Input.push(datetime)
                
                } // end of line by line loop
    
            // create data source
            source_preinterp_inc.data = {DateTime_Input: DateTime_Input, Cumulative_Input: Cumulative_Input}; 
            source_preinterp_inc.change.emit();

            // compute incremental amounts via interpolation of curve
            var dt_interp = 60; // default value of 60 minutes used on initial file load
            let [DateTime_Interp, Cumulative_Interp, Incremental]  = ComputeIncrementalRainfall(DateTime_Input, Cumulative_Input, dt_interp);
            var bar_width = [];
            for (var i = 1; i < DateTime_Interp.length; i++) {
                    bar_width[i] = 0.9*dt_interp /60 * 3600000; 
                    }

            // update source
            source_interp.data = {DateTime_Interp: DateTime_Interp, Cumulative_Interp: Cumulative_Interp, Incremental: Incremental, bar_width: bar_width}; 
            source_interp.change.emit();

            // reset dt input to default           
            dt_interp_input.value = '60';
            dt_interp_input.change.emit();

        }  // end of process_file function
    
        function CallbackTiming(){
            setTimeout(StatusTextLoading,0);
            plot_cumulative_interp.title.text = cumulativefile_input.filename;
            plot_incremental.title.text = 'Default Time Interval: 1 (hours)';
            setTimeout(process_file, 1000);
            setTimeout(StatusTextComplete, 1000);
            }
        
        CallbackTiming()
        
    """)
    
    cumulativefile_input.js_on_change("value", load_cumulativedata_callback)
    
    
    # display filename in widget - NOT WORKING?? but there on hover?
    # cumulativefile_load_button.js_on_click(load_cumulativedata_callback)
    display_filename_callback = CustomJS(args=dict(cumulativefile_input = cumulativefile_input,),
          code="""
          console.log('here')
              const file = cumulativefile_input.filename
              cumulativefile_input.title = cumulativefile_input.filename;
              """)
    cumulativefile_input.js_on_change("filename", display_filename_callback)
              
    
    
    return cumulativefile_input, cumulativefile_load_button

#%%

# round the interpolation data!!

def dtInterpolationInput():
    
    global dt_interp_input
    
    # dt_interp input
    dt_interp_input = TextInput(value=" ", title="Interpolation time interval (minutes):")
    
    load_dt_callback = CustomJS(args=dict(source_interp = source_interp,
                                          source_preinterp_inc = source_preinterp_inc,
                                          status_text_inc = status_text_inc,
                                          status_label_inc = status_label_inc,
                                          dt_interp_input = dt_interp_input,
                                          plot_incremental = plot_incremental,
                                          bar_interp = bar_interp,
                                          ), 
        
          code="""
    
        function StatusTextComplete(){
            status_text_inc.value = 'Interpolation complete.'    
            status_label_inc.text = ' '
            }

        function StatusTextInterpolating(){
            status_text_inc.value = 'Interpolating rainfall data ...'
            status_label_inc.text = 'Interpolating rainfall data ...'
            }
    
    
        // file loading ////////////////////////////////////////////////////
        function process_data() {

            // get data loaded from file
            var DateTime_Input = source_preinterp_inc.data['DateTime_Input'];
            var Cumulative_Input = source_preinterp_inc.data['Cumulative_Input']; 
            
            // get dt_interp from input box
            var dt_interp = parseFloat(dt_interp_input.value)
            
            // compute incremental amounts via interpolation of curve
            let [DateTime_Interp, Cumulative_Interp, Incremental]  = ComputeIncrementalRainfall(DateTime_Input, Cumulative_Input, dt_interp);
            var bar_width = [];
            for (var i = 1; i < DateTime_Interp.length; i++) {
                    bar_width[i] = 0.9*dt_interp/60 * 3600000; 
                    }

            // update source
            source_interp.data = {DateTime_Interp: DateTime_Interp, Cumulative_Interp: Cumulative_Interp, Incremental: Incremental, bar_width: bar_width}; 
            source_interp.change.emit();
            
            
        }  // end of process_file function
    
        function CallbackTiming(){
            console.log(plot_incremental)
            setTimeout(StatusTextInterpolating,0);
            plot_incremental.title.text = 'Time Interval: ' + dt_interp_input.value + ' (minutes)';
            setTimeout(process_data, 1000);
            setTimeout(StatusTextComplete, 1000);
            }
        
        CallbackTiming()
        
    """)
    
    dt_interp_input.js_on_change("value", load_dt_callback)
    
    return dt_interp_input

#%%

def makeExportIncrementalDataButton():
    
    export_button_inc = Button(label='Export Interpolated Data', button_type='success')
    
    export_callback_inc = CustomJS(args={'source_interp': source_interp,
                                         'status_text_inc' : status_text_inc,
                                         'status_label_inc' : status_label_inc,
                                         'cumulativefile_input' : cumulativefile_input,
                                         },

                                   code="""

                                  function StatusTextSaving(){
                                      status_text_inc.value = 'Exporting data ...'
                                      status_label_inc.text = 'Exporting data ...'
                                      }
                                  
                                  function StatusTextComplete(){
                                      status_text_inc.value = 'Data export complete.'    
                                      status_label_inc.text = ' '
                                      }

                                   function processing(){
                                        
                                        var data = source_interp.data;
                                        var datetime = data['DateTime_Interp'];
                                        var cumulative = data['Cumulative_Interp'];
                                        var incremental = data['Incremental'];
                                        
                                        var csv_data = 'DateTime,CumulativeRainfall,IncrementalRainfall\\n';
                                        for (var i = 0; i < datetime.length; i++) {
                                            var date = new Date(datetime[i]);
                                            var formatted_timestamp = date.toLocaleDateString() + " " + date.toLocaleTimeString();
                                            csv_data += formatted_timestamp + ',' + cumulative[i].toFixed(2) +  ',' + incremental[i].toFixed(2) + '\\n';
                                        }
                                        
                                        var blob = new Blob([csv_data], { type: 'text/csv;charset=utf-8;' });
                                        var link = document.createElement("a");
                                        if (link.download !== undefined) {
                                            link.setAttribute("href", window.URL.createObjectURL(blob));
                                            var csvFile = cumulativefile_input.filename.slice(0,cumulativefile_input.filename.length-4)+'_Interpolated.csv'
                                            link.setAttribute("download", csvFile);
                                            link.style.visibility = 'hidden';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }                                       
                                        }
                                   
                                   function CallbackTiming(){
                                       setTimeout(StatusTextSaving,0);
                                       setTimeout(processing, 1000);
                                       setTimeout(StatusTextComplete, 1000);
                                       }
                               
                                   CallbackTiming()


    """)
    export_button_inc.js_on_click(export_callback_inc)
    
    return export_button_inc

#%%

# here trying to work out the reset callbacks ... this triggers the on change js callbacks from above so no good at the moment

def makeResetInterpolatorButton():
    
    reset_button_inc = Button(label='Clear Data and Reset Interpolator', button_type='danger')
    
    reset_callback_inc = CustomJS(args={'source_interp': source_interp,
                                        'source_preinterp_inc' : source_preinterp_inc,
                                        
                                        'status_text_inc' : status_text_inc,
                                        'status_label_inc' : status_label_inc,
                                        
                                        'status_text_interp' : status_text_interp,
                                        'status_label_interp' : status_label_interp,
                                        
                                        'cumulativefile_input' : cumulativefile_input,
                                        'dt_interp_input' : dt_interp_input,

                                        'plot_incremental' : plot_incremental,
                                        'plot_cumulative_interp' : plot_cumulative_interp,
                                        
                                        },

                                   code="""

                                  function StatusTextProcessing(){
                                      status_text_inc.value = 'Clearing data ...'
                                      status_label_inc.text = 'Clearing data ...'
                                      status_text_interp.value = 'Clearing data ...'
                                      status_label_interp.text = 'Clearing data ...'
                                      
                                      }
                                  
                                  function StatusTextComplete(){
                                      status_text_inc.value = 'Waiting for time interval input.'    
                                      status_label_inc.text = 'Waiting for time interval input.'
                                      status_text_interp.value = 'Waiting for file input.'
                                      status_label_interp.text = 'Waiting for file input.'
                                      
                                      }

                                   function processing(){

                                       source_preinterp_inc.data['DateTime_Input'] = [];
                                       source_preinterp_inc.data['Cumulative_Input'] = [];
                                       source_preinterp_inc.change.emit();
                                       
                                       source_interp.data['DateTime_Interp']=[];
                                       source_interp.data['Cumulative_Interp']=[];
                                       source_interp.data['Incremental']=[];
                                       source_interp.change.emit();
                                       
                                       cumulativefile_input.filename = ' ';
                                       cumulativefile_input.value = [ ];
                                       cumulativefile_input.change.emit();
                                       
                                       dt_interp_input.value = ' ';
                                       dt_interp_input.change.emit();
                                       
                                        }
                                   
                                   function CallbackTiming(){
                                       setTimeout(StatusTextProcessing,0);
                                       setTimeout(processing, 1000);
                                       plot_cumulative_interp.title.text = ' ';
                                       plot_incremental.title.text = ' ';
                                       setTimeout(StatusTextComplete, 1200);
                                       }
                               
                                   CallbackTiming()


    """)
    reset_button_inc.js_on_click(reset_callback_inc)
    
    return reset_button_inc

#%%#################################################################################################################################################################################
####################################################################################################################################################################################
#
# Styling
#
####################################################################################################################################################################################
####################################################################################################################################################################################


#%% CSS TEMPLATES ###########################################################

def makeCSStemplate():

    
    # # built in Bokeh theme for plots
    # curdoc().theme = 'dark_minimal'
    
    # custom Bokeh theme for plots
    curdoc().theme = themeCustom()

    # https://github.com/bokeh/bokeh/blob/branch-3.0/src/bokeh/themes/_dark_minimal.py
    
    # custom html page css "theme"
    themeCSS = """
    {% block postamble %}
    
        <script type="text/javascript" src="MyCustomFunctions.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.0.0/papaparse.min.js"></script>
        
        <style>
    
            /* ---------- Page tabs styling -----------*/
            .bk-root .bk-tab {
                background-color: #15191C;
                color: white;
                opacity: 0.8;
                border-style: solid;
                outline_line_color: white;
            }
            
            .bk-root .bk-tabs-header .bk-tab.bk-active{
                background-color: lightskyblue;
                color: black;
                font-weight: bold;
                }
            
            .bk-root .bk-tabs-header .bk-tab:hover{
                background-color: lightsteelblue;
                }
            
            /* ---------- Font and Heading Styling -----------*/
            h1 {color: lightskyblue;}
            
            h2 {color: lightskyblue;}
            
            h3 {color: lightsteelblue;}
            
            body {
                background-color: #15191C;
                color: white;
                opacity: 0.8;
                }
            
            /* hyperlink styling */
            a:link {color: white;
                    }
            
            a:visited {color: white;
                       }
            
            a:hover {color: white;
                     }
            
            a:active {color: white;
                      }
            /* ------------ Toolbar icon styling ----------*/
            .bk-toolbar-button.bk-tool-icon-hover {display: none;}
            .bk-toolbar-button.bk-tool-icon-wheel-zoom {display: none;}
            .bk-toolbar-button.bk-tool-icon-tap-select {display: none;}
            .bk-toolbar-button.bk-tool-icon-pan {display: none;}
            
    
        </style>
    {% endblock %}
    
    """

    return themeCSS    
    
#%%
def themeCustom():
    
    # this custom Bokeh theme is based on the builtin dark_minimal theme
    # adpated/appended by nc, sep 2022 
    # https://github.com/bokeh/bokeh/blob/branch-3.0/src/bokeh/themes/_dark_minimal.py
    
    json = {
        "attrs": {
            "Plot": {
                "background_fill_color": "#20262B",
                "border_fill_color": "#15191C",
                "outline_line_color": "#E0E0E0",
                "outline_line_alpha": 0.25
                },
            
            "Grid": {
                "grid_line_color": "#E0E0E0",
                "grid_line_alpha": 0.25,
                "minor_grid_line_color" : 'grey', 
                "minor_grid_line_alpha" : 0.1,
                "minor_grid_line_dash" : 'dashed'
                },

            "Axis": {
                "major_tick_line_alpha": 0,
                "major_tick_line_color": "#E0E0E0",

                "minor_tick_line_alpha": 0,
                "minor_tick_line_color": "#E0E0E0",

                "axis_line_alpha": 0,
                "axis_line_color": "#E0E0E0",

                "major_label_text_color": "#E0E0E0",
                "major_label_text_font": "Helvetica",
                "major_label_text_font_size": "1.025em",

                "axis_label_standoff": 10,
                "axis_label_text_color": "#E0E0E0",
                "axis_label_text_font": "Helvetica",
                "axis_label_text_font_size": "1.25em",
                "axis_label_text_font_style": "normal"
                },

            "Legend": {
                "spacing": 8,
                "glyph_width": 15,

                "label_standoff": 8,
                "label_text_color": "#E0E0E0",
                "label_text_font": "Helvetica",
                "label_text_font_size": "1.025em",

                "border_line_alpha": 0,
                "background_fill_alpha": 0,
                "background_fill_color": "#20262B"
                },

            "BaseColorBar": {
                "title_text_color": "#E0E0E0",
                "title_text_font": "Helvetica",
                "title_text_font_size": "1.025em",
                "title_text_font_style": "normal",

                "major_label_text_color": "#E0E0E0",
                "major_label_text_font": "Helvetica",
                "major_label_text_font_size": "1.025em",

                "background_fill_color": "#15191C",
                "major_tick_line_alpha": 0,
                "bar_line_alpha": 0
                },

            "Title": {
                "text_color": "#E0E0E0",
                "text_font": "Helvetica",
                "text_font_size": "1.15em"
                },
            

            "Label": {
                "text_color": "#E0E0E0",
                "text_font": "Helvetica",
                "text_font_size": "1.0em"
                },
            
            "ColorBar": {
                "title_text_color": "#E0E0E0",
                "major_label_text_color": "#E0E0E0",
                },
            
            "ToolBar": {
                "line_color": "#15191C;",
                },
            
            
            
        } # attrs bracket
    } # json bracket
    
    return Theme(json=json)

#%%#################################################################################################################################################################################
####################################################################################################################################################################################
#
# End
#
####################################################################################################################################################################################
####################################################################################################################################################################################


#%%  OLD CODE

# read raw bom txt and preclean at once

# #%% FileInput widget and callback

# def RawDataFileInput():
#     # Define the CustomJS callback
#     # status_div = Div(text='Awaiting file ...')
    
#     # status_loading_callback = CustomJS(args=dict(status_div=status_div),
                                       
#     #                                    code = '''
#     #                                        status_div.text = 'Loading and pre-processing data from file ...'
#     #                                        status_div.change.emit();

#     #                                    ''')

#     file_input = FileInput(accept=".txt", width=400)
    
    # load_data_callback = CustomJS(args=dict(source_raw=source_raw,
    #                               source_clean=source_clean,
    #                               source_precleaned=source_precleaned,
    #                               source_stationInfo=source_stationInfo,
    #                               source_daily = source_daily, 
    #                               status_text = status_text,
    #                               status_label = status_label,
    #                               file_input=file_input,
    #                               plot=plot), 
        
    #       code="""

    #     function StatusTextLoading(){
    #         status_text.value = 'Loading data ...'
    #         status_label.text = 'Loading data ...'
    #         }
        
    #     function StatusTextComplete(){
    #         status_text.value = 'File import complete.'    
    #         status_label.text = ' '
    #         }

    #     // file processing ////////////////////////////////////////////////////
    #     function process_file() {

    #         var file_contents = cb_obj.value;
            
    #         // read in entire file and decode text
    #         console.log('  reading entire file ...')
    #         const decoded_file_contents = atob(file_contents);
    #         const file_lines = decoded_file_contents.split("\\n");
            
    #         // initialise arrays        
    #         var DateTime_Raw = [];
    #         var Rainfall_Raw = [];
            
    #         // get meta data
    #         console.log('  getting meta data ...')
    #         var tmp = file_lines[4].split(' ') // split based on spaces
    #         tmp = tmp.filter((str) => str !== ''); // remove empty strings in split array
    #         var StationID = tmp[0].trim()
    #         var StationName = tmp.slice(2,tmp.length-5)
    #         StationName = StationName.join(' ')
    #         plot.title.text = StationName + ' ('+StationID+')';
            
    #         // update source_stationInfo for use in file exporting callback
    #         source_stationInfo.data = {StationName : [StationName], StationID : [StationID]}
    #         source_stationInfo.change.emit();
            
    #         // read the file data line by line   //////////////////////////////////
    #         console.log('  Read file line by line ...')
    #         for (var i = 0; i < file_lines.length; i++) {
    #         //for (var i = 0; i < 20; i++) {
                
    #             // read a line
    #             var line = file_lines[i]
                
    #             // skip unwanted mid file headers    
    #             if (line.indexOf('------') !== -1) {continue}
    #             if (line.indexOf('Station') !== -1) {continue}
    #             if (line.indexOf('Number') !== -1) {continue}
    #             if (line.indexOf('rows selected') !== -1) {continue}
    #             if (line.trim().length === 0 || line.trim() === "") {continue}
                
    #             // get the time series data
    #             var tmp = line.split(' ')
    #             var date = tmp[tmp.length-2]
    #             var time = tmp[tmp.length-3]
    #             var rain = parseFloat(tmp[tmp.length-4])
    #             // this catches case where raw data column is empty in the current row
    #             if (isNaN(rain)) {
    #                 rain = parseFloat(tmp[tmp.length-5]); // get data from adjacent column
    #                 if (isNaN(rain)) {continue}
    #                 }
    #             // keep the data
    #             Rainfall_Raw.push(rain);
                
    #             // parse Date
    #             var tmp = date.split('-')
    #             var year = tmp[2];
    #             var month = tmp[1];
    #             var day = tmp[0];

    #             // parse time
    #             var tmp = time.split(':')
    #             var hours = tmp[0]
    #             var minutes = tmp[1]
                
    #             // make DateTime
    #             var tmp = new Date(year, month - 1, day, hours, minutes);
    #             tmp = Math.floor(tmp.getTime()) // unix timestamp
    #             DateTime_Raw.push(tmp)
                
    #             } // end of line by line loop

    #         // create data source
    #         source_raw.data = {DateTime_Raw: DateTime_Raw.reverse(), Rainfall_Raw: Rainfall_Raw.reverse()}; // reverse is to sort raw data in time
    #         source_raw.change.emit();
            
    #         // automatic pre-cleaning to remove obvious anomalies /////////////////////////////
    #         console.log('  Pre-clean data ...')
    #         const inc_threshold = 2 //mm
    #         var DateTime_Clean = []
    #         var Data_Clean = []
    #         for (var ii=1; ii<Rainfall_Raw.length-1; ii++){
               
    #             // get rainfall increment
    #             const inc_back = Rainfall_Raw[ii] - Rainfall_Raw[ii-1]
    #             const inc_forward = Rainfall_Raw[ii] - Rainfall_Raw[ii+1]

    #             //catch anomaly above trend
    #             if (inc_back > inc_threshold && inc_forward > inc_threshold) {continue}

    #             // catch anomaly below trend
    #             if (inc_back < -inc_threshold && inc_forward < -inc_threshold) {continue}

    #             // keep good data
    #             DateTime_Clean.push(DateTime_Raw[ii])
    #             Data_Clean.push(Rainfall_Raw[ii])
                
    #             } // end of ii for loop

    #         // remove non-unique values - keeps last occurrence ///////////////////
    #         let numbers = DateTime_Clean; 
    #         let [uniqueWithLastOccurrence, indices] = getUniqueWithLastOccurrence(numbers);
    #         DateTime_Clean = subsetArray(DateTime_Clean,indices)
    #         Data_Clean = subsetArray(Data_Clean,indices)
            
    #         // compute cumulative /////////////////////////////////////////////////
    #         var Cumulative_Clean = cumulative(Data_Clean)

    #         // update sources /////////////////////////////////////////////////////
    #         source_clean.data = {DateTime_Clean: DateTime_Clean, Rainfall_Clean: Data_Clean, Cumulative_Clean: Cumulative_Clean};
    #         source_clean.change.emit();
    #         source_precleaned.data = source_clean.data;
    #         source_precleaned.change.emit();

    #         // do the interpolation ///////////////////////////////////////////////////////////////////
    #         console.log('    Interpolate data ...')
    #         const start_hour = Math.ceil(DateTime_Clean[0] / 3600000) * 3600000
    #         const end_hour = Math.floor(DateTime_Clean[DateTime_Clean.length-1] / 3600000) * 3600000
    #         let DateTime_Daily = createIntervalArray(start_hour, end_hour, 3600000)
    #         let Cumulative_Daily = linearInterpolate(DateTime_Clean, Cumulative_Clean, DateTime_Daily)

    #         // compute Daily ////////////////////////////////////////////
    #         console.log('    Compute Daily and update source data ...')
    #         let Daily = diff(Cumulative_Daily)
    #         DateTime_Daily = DateTime_Daily.slice(0,DateTime_Daily.length-1)
    #         Cumulative_Daily = Cumulative_Daily.slice(0,Cumulative_Daily.length-1)

    #         // update source_daily
    #         source_daily.data = {DateTime_Daily: DateTime_Daily, Cumulative_Daily: Cumulative_Daily, Daily: Daily}; 
    #         source_daily.change.emit();
            
    #     }  // end of proces_file function
    
    #     function CallbackTiming(){
    #         setTimeout(StatusTextLoading,0);
    #         plot.title.text = file_input.filename;
    #         setTimeout(process_file, 1000);
    #         setTimeout(StatusTextComplete, 1000);
            
    #         }
    
    #     CallbackTiming()
        
    #     //plot.title.text = file_input.filename;
    #     //process_file(cb_obj.value);
        
    # """)

                
#     # Create a FileInput widget
#     file_input.js_on_change("value", load_data_callback)
    
#     return file_input #, status_div    
    
    
    