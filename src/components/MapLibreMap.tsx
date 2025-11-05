import { SearchBar, type Address } from './SearchBar';
import { LngLat, type MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { RLayer, RMap, RSource, useMap, RPopup, RTerrain } from 'maplibre-react-components';
import { getHoydeFromPunkt } from '../api/getHoydeFromPunkt';
import { useEffect, useState } from 'react';
import { Overlay } from './Overlay';
import DrawComponent from './DrawComponent';
import { getBygningAtPunkt } from '../api/getBygningAtPunkt';
import type { GeoJSON } from 'geojson';
/*RTerrain expansion*/
// import Toggle from "pentatrion-design";
import { Switch } from "@mui/material";

const rasterDemTiles = [
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
];
const center = { lng: 6.4, lat: 46.1 };


const TRONDHEIM_COORDS: [number, number] = [10.40565401, 63.4156575];
const polygonStyle = {
  'fill-outline-color': 'rgba(0,0,0,0.1)',
  'fill-color': 'rgba(18, 94, 45, 0.41)',
};

export const MapLibreMap = () => {
  /*RTerrain expansion */
  const [showTerrain, setShowTerrain] = useState(false);
  const [exaggeration, setExaggeration] = useState(1.3);

  const [pointHoyde, setPointHoydeAtPunkt] = useState<number | undefined>(
    undefined
  );
  const [address, setAddress] = useState<Address | null>(null);
  const [clickPoint, setClickPoint] = useState<LngLat | undefined>(undefined);
  const [bygningsOmriss, setBygningsOmriss] = useState<GeoJSON | undefined>(
    undefined
  );

  useEffect(() => {
    console.log(pointHoyde, clickPoint);
  }, [clickPoint, pointHoyde]);

  const onMapClick = async (e: MapLayerMouseEvent) => {
    const bygningResponse = await getBygningAtPunkt(e.lngLat.lng, e.lngLat.lat);
    if (bygningResponse?.FkbData?.BygningsOmriss) {
      const geoJsonObject = JSON.parse(bygningResponse.FkbData.BygningsOmriss);
      setBygningsOmriss(geoJsonObject);
    } else {
      setBygningsOmriss(undefined);
    }

    const hoyder = await getHoydeFromPunkt(e.lngLat.lng, e.lngLat.lat);
    setPointHoydeAtPunkt(hoyder[0].Z);
    setClickPoint(new LngLat(e.lngLat.lng, e.lngLat.lat));
  };

  return (
    <RMap
      minZoom={6}
      initialCenter={TRONDHEIM_COORDS}
      initialZoom={12}
      mapStyle="https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json"
      style={{
        height: `calc(100dvh - var(--header-height))`,
      }}
      onClick={onMapClick}
    >
      <Overlay>
        <h2>Søk</h2>
        <p>Her kan du søke etter ditt favoritt hus!</p>
        <SearchBar setAddress={setAddress} />
        <h3>Høyde (moh.): </h3> {pointHoyde !== undefined ? `${pointHoyde} m` : 'Vennligst velg et punkt'}

        <Switch
            checked={showTerrain}
            onChange={(e) => setShowTerrain(e.target.checked)}
          />
        <div className="flex justify-between gap-2">
          Exaggeration
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={exaggeration}
            onChange={(e) => setExaggeration(e.target.valueAsNumber)}
          />
          <span className="w-8">{exaggeration}</span>
          </div>

      </Overlay>
      <DrawComponent />

      {clickPoint && (
        <RPopup longitude={clickPoint.lng} latitude={clickPoint.lat}>
          <div>
            <strong>Height:</strong>{' '}
            {pointHoyde !== undefined ? `${pointHoyde} m` : 'Loading...'}
          </div>
        </RPopup>
      )}

      {bygningsOmriss && (
        <>
          <RSource 
          id="bygning"
          type="geojson"
          data={bygningsOmriss}
          />

          <RLayer
            source="bygning"
            id="bygning-fill"
            type="fill"
            paint={polygonStyle}
          />
        </>
      )}
      {address && (
      <MapFlyTo
         lngLat={
         new LngLat(address.PayLoad.Posisjon.X, address.PayLoad.Posisjon.Y)
         }
      />
   )}

   <RSource
        type="raster-dem"
        id="terrarium"
        tiles={rasterDemTiles}
        encoding="terrarium"
        tileSize={256}
      />
   {showTerrain && (
        <>
          <RLayer id="hillshade" type="hillshade" source="terrarium" />
          <RTerrain source="terrarium" exaggeration={exaggeration} />
        </>
      )}
    </RMap>
  );
};

function MapFlyTo({ lngLat }: { lngLat: LngLat }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo({ center: [lngLat.lng, lngLat.lat], zoom: 20, speed: 10 });
  }, [lngLat, map]);

  return null;
}
