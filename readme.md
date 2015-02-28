# node-gdaladdo

Add raster overviews with node-gdal. Tries to be just like `gdaladdo`, but `npm install`-able.

```sh
> npm install -g gdaladdo
> add-overviews --help
Usage: add-overviews filename levels
  filename: The file to build overviews for
  levels: A list of integral overview levels to build

Options:
  -r, --resampling  [optional] Select a resampling algorithm. One of "NEAREST", "GAUSS", "CUBIC", "AVERAGE", "MODE", "AVERAGE_MAGPHASE" or "NONE"  [default: "NEAREST"]
  --ro, --readonly  [optional] Open the dataset in read-only mode, in order to generate external overviews for GeoTIFFs
  -h, --help        Show this message
```
