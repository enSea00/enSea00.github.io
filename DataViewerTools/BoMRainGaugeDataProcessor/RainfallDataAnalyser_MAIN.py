# other app ideas - frequency curves, stats - annual maxima, about, format converters - e.g. rorb, hec-hms, ...

#%%
from RainfallDataAnalyser_SUB import *

from bokeh.models import Div
from bokeh.layouts import layout, row, column
from bokeh.io import output_file, save 
from bokeh.models import Tabs, TabPanel, Spacer

#%% ###############################################################################################
#
# make the file converter page 
#
###################################################################################################
plot_convert, status_label_convert, status_text_convert, plot_converted = InitialiseFileConversionPlots()
file_input_convert = RawDataFileConversion()

DivText = Div(text='''<h1>BoM Raw Rain Gauge Data File Converter</h1>
              <p>This app imports a raw (alert) rain gauge data file as provided by the Bureau of Meteorology (BoM) and then converts it to a .csv file with two columns [DateTime, Gauge Rainfall].</p><br>
              <p>The created .csv file can then be loaded into the Data Cleaning app for data quality control</p><br>
              <p>The raw BoM .txt file is assumed to have the following BoM Alert Station file format:</p><br>
              <p> 540640      0 CURRUMBIN CK ALERT	     16     16.0 20:03 16-01-2023 N</p><br>
              <p>[StationID,  SensorNr, StationName, RawAccum, Rainfall(mm), LocalTime, VoidFlag]</p><br>

              <h2>Open raw BoM rain gauge alert file (.txt):</h2>
              ''')   
              
layout_FileConverter = row(column(DivText, file_input_convert, status_text_convert, width=550),
                           column(plot_convert)
                           )

tab_FileConverter = TabPanel(child=layout_FileConverter, title="BoM File Converter (bom2csv)")

#%% ###############################################################################################
#
# make the data cleaner page 
#
###################################################################################################

plot_cleaner, plot_cumulative_cleaner, plot_incremental_cleaner, status_label_cleaner, status_text_cleaner = InitialiseDataCleanerPlots()
csvfile_input = csvDataFileInput()
remove_button = makeRemoveDataButton()
undo_button = makeUndoLastButton()
restore_button = makeRestoreToPrecleanedDataButton()
raw_button = makeRestoreToRawDataButton()
export_button = makeExportCleanedDataButton()
clear_all_button = makeClearAllDataButton()
SILOfile_input =  siloDataFileInput()

DivText = Div(text='''<h1>Rain Gauge Data Cleaner</h1>

              <p>This app can be used to undertake a quality control analysis and cleaning of raw, tipping bucket type rain gauge data.</p>
              
              <ol>
                  <li>Upload the raw gauge data.</li>
                  <ul>
                      <li>The input csv file should have two columns [DateTime, Rainfall] with DateTime having the format: dd/mm/yyyy HH:MM:SS (eg see '.csv' file produced by the bom2csv file formatter app).</li>
                      <li>The data is then automatically pre-cleaned for obvious anomalies and for duplicate timestamp entries.</li>
                  </ul>
                  <br>
                  <li>Manual quality control and data cleaning</li>
                  <ul>
                      <li>User can manually clean the data by selecting data points with the Box Select Tool in the top figure and then clicking the Delete Selected Points button.</li>
                      <li>If available, a daily rainfall reference data set (e.g. from SILO) can be uploaded to compare with the daily amounts estimated from the raw data. </li> 
                   </ul>
                   <br>
                  <li>Export the cleaned data</li>
                  <ul>
                      <li>click the Export Cleaned Data button.</li>
                  </ul>
              </ol>
              
              <h2>Open raw rain gauge file (.csv):</h2>
              <p><i>Note: </i>File must consist of two columns: <br> [DateTime, Gauge Rainfall] with DateTime formatted as 'dd/mm/yyyy HH:MM:SS'</p>
              
              ''')   

SILOdiv = Div(text='<h2>Open SILO daily rainfal reference data (.txt):</h2>')
              
layout_DataCleaner = row(column(DivText, csvfile_input, status_text_cleaner, Spacer(), SILOdiv, SILOfile_input, width=650),
             column(plot_cleaner,
                    row(remove_button, undo_button, restore_button, raw_button, export_button, clear_all_button, align='end'),
                    plot_cumulative_cleaner,
                    plot_incremental_cleaner
                    )
             )

tab_DataCleaner = TabPanel(child=layout_DataCleaner, title="Rainfall Data Cleaner")

#%% ###############################################################################################
#
# make the interpolation,  incrememntal data page
#
###################################################################################################

plot_cumulative_interp, plot_incremental, status_label_interp, status_text_interp, status_label_inc, status_text_inc, bar_interp = InitialiseInterpolatorPlots()

dt_interp_input = dtInterpolationInput()

cumulativefile_input, cumulativefile_load_button = cumulativeDataFileInput()

export_button_inc = makeExportIncrementalDataButton()

reset_button_inc = makeResetInterpolatorButton()

DivText = Div(text='''<h1>Rainfall Data Interpolator</h1>
              
              <p>This app temporally interpolates a cumulative mass curve according to a user supplied time increment (hours)</p>
              
              <ol>
                  <li>Load cumulative rainfall data</li>
                  <ul>
                      <li>Open a two column .csv file containing the cumulative rainfall data [DateTime, Cum,ulativce Rainfall]</li>
                      <li> (e.g. as created by the Rainfall Data Cleaner app).</li>
                  </ul>
                  <br>

                  <li>Specify the interpolation time interval (hours)</li>
                  <ul>
                      <li>The cumulative mass curve is then interpolated and the corresponding incremental data time series is created</li>
                  </ul>
                  <br>

                  <li>Export the interpolated data</li>
                  <ul>
                      <li>A .csv file is exported with three columns [DateTime, Cumulative, Incremental]</li>
                  </ul>
              </ol>
              
              <h2>1. Load input cumulative rainfall data file (.csv):</h2>
              <p><i>e.g. a file exported from the Rainfall Data Cleaner tab</i></p><br>
              
              ''')   

dtDiv = Div(text='''<h2>2. Enter the rainfall time increment (minutes):</h2>
              <p><i>Hit ENTER to execute interpolation.</i></p><br>
            ''')
              
layout = row(column(DivText, 
                    cumulativefile_input, 
                    status_text_interp, dtDiv, dt_interp_input, status_text_inc, export_button_inc, width=550),
             column(plot_cumulative_interp,
                    plot_incremental,
                    )
             )

tab_IncrementalData = TabPanel(child=layout, title="Rainfall Data Interpolator")


#%% create html file

# rainfall data cleaner alone
htmlFile = 'Rainfall Data Analyser.html'
themeCSS = makeCSStemplate()
output_file(htmlFile)

# data cleaner page only
# save(layout_DataCleaner, 
#           template = themeCSS, title='Rainfall Data Cleaner')

#
save(Tabs(tabs=[
                # tab_About,
                tab_FileConverter,
                tab_DataCleaner, 
                tab_IncrementalData,
                ],
 
          tabs_location='above'), 
          template = themeCSS, title='Rainfall Data Analyser')

# save(layout, template = themeCSS, title=htmlFile[0:-5])

#%%