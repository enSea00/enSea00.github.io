# other app ideas - frequency curves, stats - annual maxima, about, format converters - e.g. rorb, hec-hms, ...

#%%
from DataCleaner_SUB import *

from bokeh.models import Div
from bokeh.layouts import layout, row, column
from bokeh.io import output_file, save 
from bokeh.models import Tabs, TabPanel, Spacer

#%% ###############################################################################################
#
# make the data cleaner page 
#
###################################################################################################

plot_cleaner, status_label_cleaner, status_text_cleaner = InitialiseDataCleanerPlots()
csvfile_input = csvDataFileInput()
remove_button = makeRemoveDataButton()
undo_button = makeUndoLastButton()
raw_button = makeRestoreToRawDataButton()
export_button = makeExportCleanedDataButton()
clear_all_button = makeClearAllDataButton()

DivText = Div(text='''<h1>Data Cleaner App</h1>

              <p>This app can be used to undertake a quality control analysis and cleaning of time series data.</p>
              
              <ol>
                  <li>Upload the raw data file.</li>
                  <ul>
                      <li><b><u>IMPORTANT NOTE</u>: </b>The input csv file must have two columns [DateTime, Data] with DateTime having the format: dd/mm/yyyy HH:MM:SS.</li>
                  </ul>
                  <br>
                  <li>Manual quality control and data cleaning</li>
                  <ul>
                      <li>User can manually clean the data by selecting data points with the Box Select Tool and then clicking the Delete Selected Points button.</li>
                   </ul>
                   <br>
                  <li>Export the cleaned data</li>
                  <ul>
                      <li>click the Export Cleaned Data button.</li>
                  </ul>
              </ol>
              <p>Note that the app can be quite slow when handling large data sets</p>
              
              <h2>Open raw data file (.csv):</h2>
              <p><i><b>*** <u>IMPORTANT NOTE</u>:</b> </i>File must consist of two columns: <br> [DateTime, Data] with the DateTime column formatted as 'dd/mm/yyyy HH:MM:SS'</p>
              
              ''')   

layout_DataCleaner = row(column(DivText, csvfile_input, status_text_cleaner, width=410),
                         column(plot_cleaner,
                                row(remove_button, undo_button, raw_button, export_button, clear_all_button),
                                )
                         )

#%% create html file

# rainfall data cleaner alone
htmlFile = 'Data Cleaner.html'
themeCSS = makeCSStemplate()
output_file(htmlFile)

save(layout_DataCleaner, template = themeCSS, title='Data Cleaner')

#%%