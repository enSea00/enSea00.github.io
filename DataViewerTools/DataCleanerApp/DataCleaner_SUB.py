# -*- coding: utf-8 -*-
"""
Created on Sat Feb  4 14:11:37 2023

@author: s2154294
"""
#%%
from bokeh.models import ColumnDataSource, Button, CustomJS, BoxSelectTool, HoverTool, Div, Label, Legend, LassoSelectTool
from bokeh.models import WheelZoomTool, BoxZoomTool, DatetimeTickFormatter, FileInput, TextInput, Circle
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
    widthTimeSeriesPlots = 1300
    heightTimeSeriesPlots = 700
    line_width = 1
    
    # for the data cleaning app -----------------------------------------------
    global source_raw, color_raw, source_clean, color_clean
    source_raw = ColumnDataSource(data=dict(DateTime_Raw=[], Data_Raw=[]))
    color_raw = "#1f77b4" # color used for raw data in plots "#aec7e8"

    source_clean = ColumnDataSource(data=dict(DateTime_Clean=[], Data_Clean=[]))
    color_clean = "#ff7f0e" #"#ffbb78"

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
    
    return

LoadGlobalParameters()

#%% #################################################################################################################################################################################
#####################################################################################################################################################################################
#
# Data Cleaner App functions
#
####################################################################################################################################################################################
####################################################################################################################################################################################

#%% initialise plot

def InitialiseDataCleanerPlots():

    # plot ----------------------------------------------------------    
    global plot_cleaner, status_label_cleaner, status_text_cleaner

    plot_cleaner = figure(tools=plot_tools, height=heightTimeSeriesPlots, width=widthTimeSeriesPlots, title=' ', toolbar_location = 'above')
    plot_cleaner.xaxis.formatter = DatetimeTickFormatter(minutes='%H:%M %d/%m/%Y', hours='%H:%M %d/%m/%Y', days='%H:%M %d/%m/%Y', months='%d/%m/%Y', years='%d/%m/%Y')
    plot_cleaner.yaxis.axis_label = "Data"
    
    plot_cleaner.toolbar.active_scroll = plot_cleaner.select_one(WheelZoomTool)
    plot_cleaner.toolbar.active_drag = plot_cleaner.select_one(BoxZoomTool)
    plot_cleaner.toolbar.logo = None

    plot_cleaner.add_layout(Legend(), 'right')
    plot_cleaner.legend.click_policy = 'hide'
    
    # initialise empty source_raw and plot
    line_raw = plot_cleaner.line('DateTime_Raw','Data_Raw', source=source_raw, line_color=color_raw, line_width = line_width, legend_label='Raw Data')
    tooltips=[('Date Time', '@DateTime_Raw{%H:%M %d/%m/%Y}'),
              ('Data_Raw', '@Data_Raw')]
    plot_cleaner.add_tools(HoverTool(tooltips=tooltips, formatters={'@DateTime_Raw' : 'datetime'}, renderers=[line_raw]))
    
    # add cleaned data
    points_clean = plot_cleaner.circle('DateTime_Clean', 'Data_Clean', color=color_clean, fill_alpha = .8, source=source_clean, legend_label='Cleaned Data')
    points_clean.selection_glyph = Circle(fill_color=color_clean, line_color=color_clean, fill_alpha=0.2, line_alpha=0.5)
    points_clean.nonselection_glyph = Circle(fill_color=color_clean, line_color=color_clean, fill_alpha=1)

    tooltips=[('Date Time', '@DateTime_Clean{%H:%M %d/%m/%Y}'),
              ('Data_Clean', '@Data_Clean')]
    plot_cleaner.add_tools(HoverTool(tooltips=tooltips, formatters={'@DateTime_Clean' : 'datetime'}, renderers=[points_clean]))
    
    # add selection box tool for "clean" cds
    tool_BoxSelect = BoxSelectTool(renderers=[points_clean])
    plot_cleaner.add_tools(tool_BoxSelect)
    
    # tool_BoxSelect = LassoSelectTool(renderers=[points_clean])
    # plot_cleaner.add_tools(tool_BoxSelect)

    
    # status label
    status_label_cleaner = Label(x=int(widthTimeSeriesPlots/3), y=int(heightTimeSeriesPlots/2), x_units='screen', y_units='screen',
                 text='Waiting for file input.', text_font_size='30px', text_align="center")
    plot_cleaner.add_layout(status_label_cleaner)

    # status text box
    status_text_cleaner = TextInput(value="Waiting for file input.", width = 400, title="Status:")
    
    return plot_cleaner, status_label_cleaner, status_text_cleaner

#%% load raw csv file 

def csvDataFileInput():
    
    # two columns [DateTime, Data_Raw]
    global csvfile_input
    
    csvfile_input = FileInput(accept=".csv",width=400)
    

    load_csvdata_callback = CustomJS(args=dict(source_raw = source_raw,
                                               source_clean = source_clean,
                                               status_text_cleaner = status_text_cleaner,
                                               status_label_cleaner = status_label_cleaner,
                                               csvfile_input = csvfile_input,
                                               plot_cleaner = plot_cleaner,
                                               ), 
        
          code="""
    
        function StatusTextLoading(){
            status_text_cleaner.value = 'Loading data ...'
            status_label_cleaner.text = 'Loading data ...'
            }
        
        function StatusTextComplete(){
            status_text_cleaner.value = 'File import complete.'    
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
            var Data_Raw = [];
            
            // read the file data line by line   //////////////////////////////////
            for (var i = 1; i < file_lines.length; i++) {
                
                // read a line
                var line = file_lines[i]

                // check for end of file
                if (line.trim().length === 0 || line.trim() === "") {continue}
                
                // get the time series data
                var tmp = line.split(',')
                var data = parseFloat(tmp[1].trim())
                Data_Raw.push(data);

                // parse date time
                var datetime_string = tmp[0];
                var date_parts = datetime_string.split(" ")[0].split("/");
                var time_parts = datetime_string.split(" ")[1].split(":");
                var datetime = new Date(date_parts[2], date_parts[1] - 1, date_parts[0], time_parts[0], time_parts[1]);
                datetime = Math.floor(datetime.getTime()) // unix timestamp
                DateTime_Raw.push(datetime)
                
                } // end of line by line loop
    
            // create data source
            source_raw.data = {DateTime_Raw: DateTime_Raw, Data_Raw: Data_Raw}; 
            source_raw.change.emit();
            
            // remove non-unique values - keeps last occurrence ///////////////////
            let DateTime_Clean = DateTime_Raw; 
            let Data_Clean = Data_Raw; 

            let numbers = DateTime_Clean; 
            let [uniqueWithLastOccurrence, indices] = getUniqueWithLastOccurrence(numbers);
            DateTime_Clean = subsetArray(DateTime_Clean,indices)
            Data_Clean = subsetArray(Data_Clean,indices)
            
            // update sources /////////////////////////////////////////////////////
            source_clean.data = {DateTime_Clean: DateTime_Clean, Data_Clean: Data_Clean};
            source_clean.change.emit();
            
            // create cleaned data file for saving to
            
            
    
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


#%% Remove Data button and callback

def makeRemoveDataButton():

    remove_button = Button(label='Delete Selected Points', button_type='danger')
    remove_callback = CustomJS(args={'source_clean' : source_clean,
                                     'status_label_cleaner' : status_label_cleaner,
                                     'status_text_cleaner' : status_text_cleaner,
                                     }, 
                               code="""
                               
        function StatusTextLoading(){
            status_text_cleaner.value = 'Deleting selected data ...'
            status_label_cleaner.text = 'Deleting selected data ...'
            }
        
        function StatusTextComplete(){
            status_text_cleaner.value = 'Data deletion complete.'    
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
            var y = data['Data_Clean'];
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
            
            // update sources /////////////////////////////////////////////////////
            source_clean.data = {DateTime_Clean: new_x, Data_Clean: new_y};
            source_clean.change.emit();

            } // end of processing function

        function CallbackTiming(){
            setTimeout(StatusTextLoading,0);
            setTimeout(processing, 1500);
            setTimeout(StatusTextComplete, 1000);
            }
    
        CallbackTiming()

        
    """)
    remove_button.js_on_click(remove_callback)

    return remove_button

#%%

def makeUndoLastButton():
    undo_button = Button(label='Undo Last Delete', button_type='warning')
    undo_callback = CustomJS(args={'source_clean': source_clean,
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
            var y = data['Data_Clean'];
            
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
            source_clean.data = {'DateTime_Clean': x, 'Data_Clean': y};
            
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

def makeRestoreToRawDataButton():
    
    raw_button = Button(label='Restore to Raw Data')
    raw_callback = CustomJS(args={'source_clean': source_clean,
                                  'source_raw' : source_raw,
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
                                       var y = data['Data_Raw'];
                                       
                                       // sort data based on x (time)
                                       let combined = [];
                                       for (let i = 0; i < y.length; i++) {
                                         combined.push({ y: y[i], x: x[i] });
                                       }
                                       combined.sort((a, b) => a.x - b.x);
                                       y = combined.map(point => point.y);
                                       x = combined.map(point => point.x);
                                       
                                    // update source
                                    source_clean.data = {DateTime_Clean: x, Data_Clean: y};
                                    source_clean.change.emit();
                                   
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
                                        'status_label_cleaner' : status_label_cleaner,
                                        'status_text_cleaner' : status_text_cleaner,
                                        'plot_cleaner' : plot_cleaner,
                                        'csvfile_input' : csvfile_input},
                               code="""

                                    // update source
                                    source_clean.data = {DateTime_Clean: [], Data_Clean: []};
                                    source_clean.change.emit();

                                    source_raw.data = {DateTime_Raw: [], Data_Raw: []};
                                    source_raw.change.emit();
                                    
                                    plot_cleaner.title.text = ' ';

                                   // csvfile_input.value = [ ];
                                   status_text_cleaner.value = 'Waiting for a new file input. \\n To reload the previous file you need to first refresh the page.'
                                   status_label_cleaner.text = 'Waiting for a new file input. \\n To reload the previous file you need to first refresh the page.'
                                   
                               """)
    clear_all_button.js_on_click(clear_all_callback)

    return clear_all_button

#%%

# how to create a save button to save progress

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
                                        var y = data['Data_Clean'];
                                
                                        var csv_data = 'DateTime,Data_Cleaned\\n';
                                        for (var i = 0; i < x.length; i++) {
                                            var date = new Date(x[i]);
                                            var formatted_timestamp = date.toLocaleDateString() + " " + date.toLocaleTimeString();
                                            csv_data += formatted_timestamp + ',' + y[i] + '\\n';
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

