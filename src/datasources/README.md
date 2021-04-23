# Autoloading Datasources
All files in this folder (and subfolders) will be loaded at runtime.

In order to be loaded, the filename must end with `.datasource.js` and export a load function taking key as argument.
Example: openformat.datasource.js may be accessed in a resolver `context.datasources.openformat.load("some-pid");`. Note that, the beginning of the filename determines the name of the datasource.

Performance metrics for datasources are found at http://localhost:9599/metrics

To enable Redis caching for a datasource, export options object like 
```
export const options {
  redis: {
    prefix: 'cache-key-prefix',
    ttl: 60 * 60 * 24    
  }
}
```

Add howru check to datasource by exporting a createStatusChecker function. Checks are executed when visiting http:localhost:3000/howru.