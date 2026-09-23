import React, { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiMapPin, FiPlus, FiTrash2 } from 'react-icons/fi';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { useResource } from '../components/useResource';
import { ImageUpload } from '../components/ImageUpload';
import { ConfirmDialog, Modal } from '../components/Modal';
import { Alert, Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Spinner, TextArea, Toggle, cx } from '../components/ui';

// Same palette as the kiosk's Wayfinding screen.
const LOCATION_TYPES = {
  entrance: { label: 'Entrance', color: 'bg-green-500' },
  service: { label: 'Service desk', color: 'bg-blue-500' },
  amenity: { label: 'Amenity', color: 'bg-orange-500' },
  collection: { label: 'Collection', color: 'bg-purple-500' },
  technology: { label: 'Technology', color: 'bg-red-500' },
  study: { label: 'Study space', color: 'bg-yellow-500' }
};

const emptyFloor = () => ({ name: '', sortOrder: 0, published: true, image: null });
const emptyLocation = (floorId) => ({ floorId, name: '', type: 'service', x: 50, y: 50, directions: '', sortOrder: 0 });

export default function MapPage() {
  const toast = useToast();
  const { data: floors, error, loading, reload } = useResource('/api/cms/map');
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [floorEditor, setFloorEditor] = useState(null); // { id|null, form, errors, saving }
  const [locationDraft, setLocationDraft] = useState(null); // { id|null, form, errors, saving }
  const [pendingDelete, setPendingDelete] = useState(null); // { kind: 'floor'|'location', item }
  const [deleting, setDeleting] = useState(false);

  const floor = useMemo(() => {
    if (!floors?.length) return null;
    return floors.find((f) => f.id === selectedFloorId) ?? floors[0];
  }, [floors, selectedFloorId]);

  useEffect(() => {
    if (floor && floor.id !== selectedFloorId) setSelectedFloorId(floor.id);
  }, [floor, selectedFloorId]);

  // ----- floors -----
  const openFloor = (item) =>
    setFloorEditor({
      id: item?.id ?? null,
      form: item
        ? { name: item.name, sortOrder: item.sortOrder, published: item.published, image: item.mapImageId ? { id: item.mapImageId, url: item.mapImageUrl } : null }
        : emptyFloor(),
      errors: {},
      saving: false
    });

  const updateFloor = (field, value) =>
    setFloorEditor((c) => ({ ...c, form: { ...c.form, [field]: value }, errors: { ...c.errors, [field]: undefined } }));

  const saveFloor = async (event) => {
    event.preventDefault();
    setFloorEditor((c) => ({ ...c, saving: true }));
    const { image, ...rest } = floorEditor.form;
    const payload = { ...rest, sortOrder: Number(rest.sortOrder) || 0, mapImageId: image?.id ?? null };
    try {
      if (floorEditor.id === null) {
        const created = await api.post('/api/cms/floors', payload);
        setSelectedFloorId(created.id);
        toast.success('Floor added');
      } else {
        await api.put(`/api/cms/floors/${floorEditor.id}`, payload);
        toast.success('Floor updated');
      }
      setFloorEditor(null);
      reload();
    } catch (err) {
      setFloorEditor((c) => c && { ...c, saving: false, errors: err.errors ?? {}, message: err.message });
    }
  };

  // ----- locations -----
  const openLocation = (item) =>
    setLocationDraft({
      id: item?.id ?? null,
      form: item ? { floorId: item.floorId, name: item.name, type: item.type, x: item.x, y: item.y, directions: item.directions, sortOrder: item.sortOrder } : emptyLocation(floor.id),
      errors: {},
      saving: false
    });

  const updateLocation = (field, value) =>
    setLocationDraft((c) => ({ ...c, form: { ...c.form, [field]: value }, errors: { ...c.errors, [field]: undefined } }));

  const saveLocation = async (event) => {
    event.preventDefault();
    setLocationDraft((c) => ({ ...c, saving: true }));
    const payload = {
      ...locationDraft.form,
      x: Number(locationDraft.form.x),
      y: Number(locationDraft.form.y),
      sortOrder: Number(locationDraft.form.sortOrder) || 0
    };
    try {
      if (locationDraft.id === null) {
        await api.post('/api/cms/locations', payload);
        toast.success('Location added');
      } else {
        await api.put(`/api/cms/locations/${locationDraft.id}`, payload);
        toast.success('Location updated');
      }
      setLocationDraft(null);
      reload();
    } catch (err) {
      setLocationDraft((c) => c && { ...c, saving: false, errors: err.errors ?? {}, message: err.message });
      if (!err.errors) toast.error(err.message);
    }
  };

  // Clicking the plan while a location is being edited moves its marker there.
  const handleMapClick = (event) => {
    if (!locationDraft) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 1000) / 10;
    setLocationDraft((c) => ({ ...c, form: { ...c.form, x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) } }));
  };

  const confirmDelete = async () => {
    setDeleting(true);
    const { kind, item } = pendingDelete;
    try {
      await api.delete(`/api/cms/${kind === 'floor' ? 'floors' : 'locations'}/${item.id}`);
      toast.success(kind === 'floor' ? 'Floor deleted' : 'Location deleted');
      if (kind === 'floor') setSelectedFloorId(null);
      setPendingDelete(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const draftMarker = locationDraft?.form;

  return (
    <>
      <PageHeader
        title="Floors & map"
        description="Upload a floor plan for each floor and place the locations visitors look for. Positions are stored as percentages, so any image size works."
        actions={<Button onClick={() => openFloor(null)}><FiPlus aria-hidden="true" /> Add floor</Button>}
      />
      {error && <Alert tone="error" className="mb-4">{error.message}</Alert>}
      {loading && !floors ? (
        <div className="flex justify-center py-16"><Spinner className="w-6 h-6 text-primary-600" /></div>
      ) : !floors?.length ? (
        <Card><EmptyState icon={FiMapPin} title="No floors yet" description="Add a floor, upload its plan, then place locations on it." action={<Button onClick={() => openFloor(null)}>Add floor</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          {/* Floors */}
          <Card title="Floors" padded={false} className="xl:col-span-1">
            <ul className="divide-y divide-gray-100">
              {floors.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => { setSelectedFloorId(item.id); setLocationDraft(null); }}
                    className={cx('w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-gray-50', item.id === floor?.id && 'bg-primary-50 text-primary-800')}
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="flex items-center gap-2 text-xs text-gray-500">
                      {item.locations.length} {item.locations.length === 1 ? 'place' : 'places'}
                      {!item.published && <Badge>Hidden</Badge>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {floor && (
              <div className="flex items-center gap-1 px-3 py-3 border-t border-gray-100">
                <Button variant="ghost" size="sm" onClick={() => openFloor(floor)}><FiEdit2 aria-hidden="true" /> Edit floor</Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setPendingDelete({ kind: 'floor', item: floor })}><FiTrash2 aria-hidden="true" /> Delete</Button>
              </div>
            )}
          </Card>

          {/* Map */}
          <Card
            title={floor?.name}
            description={locationDraft ? 'Click on the plan to move the highlighted marker.' : floor?.mapImageUrl ? 'Click a marker to edit it.' : 'No plan uploaded yet: markers are shown on a grid. Edit the floor to upload one.'}
            className="xl:col-span-2"
            actions={<Button size="sm" onClick={() => openLocation(null)} disabled={Boolean(locationDraft)}><FiPlus aria-hidden="true" /> Add location</Button>}
          >
            {floor && (
              <div
                className={cx('relative rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-100 select-none', !floor.mapImageUrl && 'aspect-square', locationDraft && 'cursor-crosshair ring-2 ring-primary-400')}
                onClick={handleMapClick}
              >
                {floor.mapImageUrl ? (
                  <img src={floor.mapImageUrl} alt={`Plan of ${floor.name}`} className="block w-full h-auto pointer-events-none" draggable={false} />
                ) : (
                  <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#d4d4d8 1px, transparent 1px), linear-gradient(90deg, #d4d4d8 1px, transparent 1px)', backgroundSize: '10% 10%' }} />
                )}
                {floor.locations.map((item) => {
                  const isDraft = locationDraft?.id === item.id;
                  const pos = isDraft ? draftMarker : item;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={item.name}
                      aria-label={`Edit ${item.name}`}
                      onClick={(event) => { event.stopPropagation(); if (!locationDraft) openLocation(item); }}
                      className={cx('absolute -translate-x-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-white shadow ring-2 ring-white flex items-center justify-center', LOCATION_TYPES[item.type]?.color ?? 'bg-gray-500', isDraft && 'ring-4 ring-primary-500 scale-125 z-10', locationDraft && !isDraft && 'opacity-40 pointer-events-none')}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    >
                      <FiMapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  );
                })}
                {locationDraft && locationDraft.id === null && (
                  <span
                    className="absolute -translate-x-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-primary-600 text-white shadow ring-4 ring-primary-300 flex items-center justify-center z-10 pointer-events-none"
                    style={{ left: `${draftMarker.x}%`, top: `${draftMarker.y}%` }}
                  >
                    <FiMapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                )}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
              {Object.entries(LOCATION_TYPES).map(([key, { label, color }]) => (
                <span key={key} className="inline-flex items-center gap-1.5"><span className={cx('h-2.5 w-2.5 rounded-full', color)} /> {label}</span>
              ))}
            </div>
          </Card>

          {/* Locations / editor */}
          <div className="xl:col-span-1 space-y-4">
            {locationDraft ? (
              <Card title={locationDraft.id === null ? 'New location' : 'Edit location'}>
                <form onSubmit={saveLocation} className="space-y-3" noValidate>
                  {locationDraft.message && !Object.keys(locationDraft.errors).length && <Alert tone="error">{locationDraft.message}</Alert>}
                  <Field label="Name" htmlFor="loc-name" required error={locationDraft.errors.name}>
                    <Input id="loc-name" value={locationDraft.form.name} onChange={(e) => updateLocation('name', e.target.value)} invalid={Boolean(locationDraft.errors.name)} maxLength={100} />
                  </Field>
                  <Field label="Type" htmlFor="loc-type" error={locationDraft.errors.type}>
                    <Select id="loc-type" value={locationDraft.form.type} onChange={(e) => updateLocation('type', e.target.value)}>
                      {Object.entries(LOCATION_TYPES).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
                    </Select>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Left (%)" htmlFor="loc-x" error={locationDraft.errors.x}>
                      <Input id="loc-x" type="number" min={0} max={100} step={0.1} value={locationDraft.form.x} onChange={(e) => updateLocation('x', e.target.value)} invalid={Boolean(locationDraft.errors.x)} />
                    </Field>
                    <Field label="Top (%)" htmlFor="loc-y" error={locationDraft.errors.y}>
                      <Input id="loc-y" type="number" min={0} max={100} step={0.1} value={locationDraft.form.y} onChange={(e) => updateLocation('y', e.target.value)} invalid={Boolean(locationDraft.errors.y)} />
                    </Field>
                  </div>
                  <Field label="Directions" htmlFor="loc-directions" error={locationDraft.errors.directions} hint="Shown when a visitor taps the marker.">
                    <TextArea id="loc-directions" rows={3} value={locationDraft.form.directions} onChange={(e) => updateLocation('directions', e.target.value)} maxLength={1000} />
                  </Field>
                  <Field label="Order" htmlFor="loc-order" error={locationDraft.errors.sortOrder}>
                    <Input id="loc-order" type="number" value={locationDraft.form.sortOrder} onChange={(e) => updateLocation('sortOrder', e.target.value)} />
                  </Field>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="secondary" size="sm" onClick={() => setLocationDraft(null)} disabled={locationDraft.saving}>Cancel</Button>
                    <Button type="submit" size="sm" loading={locationDraft.saving}>Save</Button>
                  </div>
                </form>
              </Card>
            ) : (
              <Card title="Locations" description={floor ? `${floor.locations.length} on ${floor.name}` : ''} padded={false}>
                {floor?.locations.length ? (
                  <ul className="divide-y divide-gray-100 max-h-[32rem] overflow-y-auto">
                    {floor.locations.map((item) => (
                      <li key={item.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <span className={cx('h-2.5 w-2.5 rounded-full flex-shrink-0', LOCATION_TYPES[item.type]?.color ?? 'bg-gray-400')} aria-hidden="true" />
                        <span className="flex-1 min-w-0">
                          <span className="block font-medium text-gray-900 truncate">{item.name}</span>
                          <span className="block text-xs text-gray-500">{LOCATION_TYPES[item.type]?.label ?? item.type}</span>
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => openLocation(item)} aria-label={`Edit ${item.name}`}><FiEdit2 aria-hidden="true" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setPendingDelete({ kind: 'location', item })} aria-label={`Delete ${item.name}`}><FiTrash2 aria-hidden="true" /></Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState icon={FiMapPin} title="No locations on this floor" description="Add one and click on the plan to place it." />
                )}
              </Card>
            )}
          </div>
        </div>
      )}

      <Modal
        open={Boolean(floorEditor)}
        title={floorEditor?.id === null ? 'Add floor' : 'Edit floor'}
        onClose={floorEditor?.saving ? undefined : () => setFloorEditor(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFloorEditor(null)} disabled={floorEditor?.saving}>Cancel</Button>
            <Button type="submit" form="floor-form" loading={floorEditor?.saving}>Save</Button>
          </>
        }
      >
        {floorEditor && (
          <form id="floor-form" onSubmit={saveFloor} className="space-y-4" noValidate>
            {floorEditor.message && !Object.keys(floorEditor.errors).length && <Alert tone="error">{floorEditor.message}</Alert>}
            <div className="grid grid-cols-3 gap-4">
              <Field label="Name" htmlFor="floor-name" required error={floorEditor.errors.name} className="col-span-2">
                <Input id="floor-name" value={floorEditor.form.name} onChange={(e) => updateFloor('name', e.target.value)} invalid={Boolean(floorEditor.errors.name)} maxLength={100} />
              </Field>
              <Field label="Order" htmlFor="floor-order" error={floorEditor.errors.sortOrder} hint="Lowest first.">
                <Input id="floor-order" type="number" value={floorEditor.form.sortOrder} onChange={(e) => updateFloor('sortOrder', e.target.value)} />
              </Field>
            </div>
            <ImageUpload label="Floor plan" value={floorEditor.form.image} onChange={(image) => updateFloor('image', image)} hint="A clear top-down plan works best. PNG, JPEG, WebP or GIF up to 10 MB." previewClassName="h-56" />
            <Toggle checked={floorEditor.form.published} onChange={(value) => updateFloor('published', value)} label="Show on the kiosk" />
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete?.kind === 'floor' ? `Delete ${pendingDelete.item.name}?` : `Delete ${pendingDelete?.item.name}?`}
        message={pendingDelete?.kind === 'floor' ? 'All locations on this floor are deleted with it. The floor plan image stays in the image library.' : 'The marker is removed from the map.'}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
        busy={deleting}
      />
    </>
  );
}
