import { SearchBar, type Address } from './SearchBar';
import { LngLat, type MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { RLayer, RMap, RSource, useMap } from 'maplibre-react-components';
import { getHoydeFromPunkt } from '../api/getHoydeFromPunkt';
import { useEffect, useState } from 'react';
import { Overlay } from './Overlay';
import DrawComponent from './DrawComponent';
import { getBygningAtPunkt } from '../api/getBygningAtPunkt';
import type { GeoJSON } from 'geojson';

const TRONDHEIM_COORDS: [number, number] = [10.40565401, 63.4156575];
const polygonStyle = {
  'fill-outline-color': 'rgba(0,0,0,0.1)',
  'fill-color': 'rgba(18, 94, 45, 0.41)',
};

export const MapLibreMap = () => {
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
        <h2>Dette er et overlay</h2>
        <p>Legg til funksjonalitet knyttet til kartet.</p>
        <SearchBar setAddress={setAddress} />
      </Overlay>
      <DrawComponent />
      {bygningsOmriss && (
        <>
          <RSource id="bygning" type="geojson" data={bygningsOmriss} />
          <RLayer
            source="bygning"
            id="bygning-fill"
            type="fill"
            paint={polygonStyle}
          />
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
