library(tidyverse)
library(geobr)
library(geojsonsf)
library(sf)
library(rmapshaper)

mapa_estados <- geobr::read_state()

bboxes <- c()

for (i in 1:nrow(mapa_estados)) {
  mapa_estados$bbox_xmin[i] <- sf::st_bbox(mapa_estados$geom[i])['xmin']
  mapa_estados$bbox_ymin[i] <- sf::st_bbox(mapa_estados$geom[i])['ymin']
  mapa_estados$bbox_xmax[i] <- sf::st_bbox(mapa_estados$geom[i])['xmax']
  mapa_estados$bbox_ymax[i] <- sf::st_bbox(mapa_estados$geom[i])['ymax']
}

mapa_simples <- rmapshaper::ms_simplify(mapa_estados, keep = 0.02,
                                        keep_shapes = TRUE)

mapa_geo <- geojsonsf::sf_geojson(mapa_simples, simplify = TRUE, digits = 6)

write(mapa_geo, 'map.geojson')
bbox_br <- st_bbox(mapa_estados %>% group_by() %>% summarise(geom))
center_x <- mean(bbox_br['xmin'], bbox_br['xmax'])
center_y <- mean(bbox_br['ymin'], bbox_br['ymax'])
#ggplot(mapa_simples) + geom_sf()
