# Autoloading Datasources
All files in this folder (and subfolders) will be loaded at runtime.

In order to be loaded, the filename must end with `.datasource.js` and export a batchLoader function as default. 
Example: openformat.datasource.js may be accessed in a resolver `context.datasources.openformat.load("some-pid");`. Note that, the beginning of the filename determines the name of the datasource. 