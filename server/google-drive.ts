// Google Drive Integration for MDRRMO Pio Duran
// Using the google-drive connector blueprint

import { google } from 'googleapis';
import type { DriveFolder, DriveFile, GalleryImage } from '@shared/schema';

const DEMO_MODE = process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'development';
const ADMIN_MAPS_FOLDER_ID = process.env.GOOGLE_DRIVE_MAPS_FOLDER_ID || '1Pz2MM0Ge4RPQ6tdUORibYGoeKepJ9RSt';
const DOCUMENTS_ROOT_FOLDER_ID = '15_xiFeXu_vdIe2CYrjGaRCAho2OqhGvo';

let connectionSettings: any = null;
let lastFetchTime = 0;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  
  if (connectionSettings && 
      connectionSettings.settings?.expires_at && 
      new Date(connectionSettings.settings.expires_at).getTime() > now + 60000) {
    return connectionSettings.settings.access_token;
  }

  if (now - lastFetchTime < 5000) {
    throw new Error('Token fetch rate limited');
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken || !hostname) {
    throw new Error('Replit connector environment not available');
  }

  lastFetchTime = now;

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Connector fetch failed: ${response.status}`);
  }
  
  const data = await response.json();
  connectionSettings = data.items?.[0];

  const accessToken = connectionSettings?.settings?.access_token || 
                      connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive connector not configured. Please connect your Google Drive in the integrations panel.');
  }
  
  return accessToken;
}

async function getGoogleDriveClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

const sampleDocumentFolders: DriveFolder[] = [
  {
    id: 'folder-1',
    name: 'Official Documents',
    files: [
      { id: 'doc-1', name: 'MDRRMP Resolution 2024.pdf', mimeType: 'application/pdf', webViewLink: '#' },
      { id: 'doc-2', name: 'Contingency Plan - Flood.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', webViewLink: '#' },
      { id: 'doc-3', name: 'Emergency Operations Center Manual.pdf', mimeType: 'application/pdf', webViewLink: '#' },
    ]
  },
  {
    id: 'folder-2',
    name: 'BDRRMP Files',
    files: [
      { id: 'doc-4', name: 'Barangay Caguscos BDRRMP.pdf', mimeType: 'application/pdf', webViewLink: '#' },
      { id: 'doc-5', name: 'Barangay Sugod BDRRMP.pdf', mimeType: 'application/pdf', webViewLink: '#' },
      { id: 'doc-6', name: 'Barangay Rawis BDRRMP.pdf', mimeType: 'application/pdf', webViewLink: '#' },
    ]
  },
  {
    id: 'folder-3',
    name: 'Reports',
    files: [
      { id: 'doc-7', name: 'Monthly Report - November 2024.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', webViewLink: '#' },
      { id: 'doc-8', name: 'Situational Report - Typhoon Kristine.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', webViewLink: '#' },
    ]
  },
  {
    id: 'folder-4',
    name: 'Training Materials',
    files: [
      { id: 'doc-9', name: 'ICS Training Presentation.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', webViewLink: '#' },
      { id: 'doc-10', name: 'First Aid Manual.pdf', mimeType: 'application/pdf', webViewLink: '#' },
    ]
  },
];

const sampleGalleryFolders: DriveFolder[] = [
  { id: 'gallery-1', name: 'Evacuation Drills 2024' },
  { id: 'gallery-2', name: 'Training Activities' },
  { id: 'gallery-3', name: 'Emergency Response Operations' },
  { id: 'gallery-4', name: 'Community Outreach' },
  { id: 'gallery-5', name: 'Equipment and Facilities' },
];

const sampleGalleryImages: Record<string, GalleryImage[]> = {
  'gallery-1': [
    { id: 'img-1', name: 'Barangay Drill 1.jpg', thumbnailLink: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400', webViewLink: '#', folder: 'gallery-1' },
    { id: 'img-2', name: 'Evacuation Exercise.jpg', thumbnailLink: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400', webViewLink: '#', folder: 'gallery-1' },
    { id: 'img-3', name: 'Community Drill.jpg', thumbnailLink: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', webViewLink: '#', folder: 'gallery-1' },
  ],
  'gallery-2': [
    { id: 'img-4', name: 'First Aid Training.jpg', thumbnailLink: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400', webViewLink: '#', folder: 'gallery-2' },
    { id: 'img-5', name: 'CPR Workshop.jpg', thumbnailLink: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=400', webViewLink: '#', folder: 'gallery-2' },
  ],
  'gallery-3': [
    { id: 'img-6', name: 'Rescue Operation.jpg', thumbnailLink: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400', webViewLink: '#', folder: 'gallery-3' },
    { id: 'img-7', name: 'Relief Distribution.jpg', thumbnailLink: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400', webViewLink: '#', folder: 'gallery-3' },
  ],
  'gallery-4': [
    { id: 'img-8', name: 'IEC Campaign.jpg', thumbnailLink: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400', webViewLink: '#', folder: 'gallery-4' },
    { id: 'img-9', name: 'School Visit.jpg', thumbnailLink: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400', webViewLink: '#', folder: 'gallery-4' },
  ],
  'gallery-5': [
    { id: 'img-10', name: 'Rescue Truck.jpg', thumbnailLink: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', webViewLink: '#', folder: 'gallery-5' },
    { id: 'img-11', name: 'MDRRMO Office.jpg', thumbnailLink: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400', webViewLink: '#', folder: 'gallery-5' },
  ],
};

export async function getDocumentFolders(): Promise<DriveFolder[]> {
  if (DEMO_MODE) {
    console.log('[DEMO] Returning sample document folders');
    return sampleDocumentFolders;
  }
  
  try {
    const drive = await getGoogleDriveClient();
    
    // Fetch only folders from the specific root folder
    const response = await drive.files.list({
      q: `'${DOCUMENTS_ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 100,
      orderBy: 'name',
    });

    const folders = response.data.files || [];
    
    if (folders.length === 0) {
      console.warn('No folders found in the specified Google Drive folder');
      return [];
    }
    
    // Fetch all files from the root folder (not from subfolders)
    const filesResponse = await drive.files.list({
      q: `'${DOCUMENTS_ROOT_FOLDER_ID}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, createdTime, modifiedTime, size)',
      pageSize: 500,
      orderBy: 'name',
    });

    const allFiles = filesResponse.data.files || [];

    // Create folder structure
    const result: DriveFolder[] = folders.map(folder => ({
      id: folder.id!,
      name: folder.name!,
      files: [],
    }));

    // Add a special "All Files" entry at the beginning containing all files
    if (allFiles.length > 0) {
      result.unshift({
        id: DOCUMENTS_ROOT_FOLDER_ID,
        name: 'All Documents',
        files: allFiles.map(file => ({
          id: file.id!,
          name: file.name!,
          mimeType: file.mimeType!,
          webViewLink: file.webViewLink || undefined,
          webContentLink: file.webContentLink || undefined,
          thumbnailLink: file.thumbnailLink || undefined,
          createdTime: file.createdTime || undefined,
          modifiedTime: file.modifiedTime || undefined,
          size: file.size || undefined,
        })),
      });
    }

    return result;
  } catch (error) {
    console.error('Error fetching document folders from Google Drive:', error);
    if (DEMO_MODE) {
      return sampleDocumentFolders;
    }
    throw error;
  }
}

export async function getAdministrativeMaps(): Promise<DriveFolder[]> {
  if (DEMO_MODE) {
    console.log('[DEMO] Returning empty administrative maps');
    return [];
  }
  
  try {
    const drive = await getGoogleDriveClient();
    
    const response = await drive.files.list({
      q: `'${ADMIN_MAPS_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 50,
    });

    const folders = response.data.files || [];
    
    if (folders.length === 0) {
      console.warn('No administrative maps found in Drive');
      return [];
    }
    
    const result: DriveFolder[] = await Promise.all(
      folders.map(async (folder) => {
        const filesResponse = await drive.files.list({
          q: `'${folder.id}' in parents and trashed=false`,
          fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink)',
          pageSize: 50,
        });

        return {
          id: folder.id!,
          name: folder.name!,
          files: (filesResponse.data.files || []).map(file => ({
            id: file.id!,
            name: file.name!,
            mimeType: file.mimeType!,
            webViewLink: file.webViewLink || undefined,
            webContentLink: file.webContentLink || undefined,
            thumbnailLink: file.thumbnailLink || undefined,
          })),
        };
      })
    );

    return result;
  } catch (error) {
    console.error('Error fetching administrative maps from Google Drive:', error);
    throw error;
  }
}

export async function getGalleryFolders(): Promise<DriveFolder[]> {
  if (DEMO_MODE) {
    console.log('[DEMO] Returning sample gallery folders');
    return sampleGalleryFolders;
  }
  
  try {
    const drive = await getGoogleDriveClient();
    
    const response = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 30,
    });

    const folders = response.data.files || [];
    
    if (folders.length === 0) {
      console.warn('Google Drive returned no gallery folders');
      return [];
    }

    return folders.map(folder => ({
      id: folder.id!,
      name: folder.name!,
    }));
  } catch (error) {
    console.error('Error fetching gallery folders from Google Drive:', error);
    if (DEMO_MODE) {
      return sampleGalleryFolders;
    }
    throw error;
  }
}

export async function getGalleryImages(folderId: string): Promise<GalleryImage[]> {
  if (!folderId) {
    throw new Error('Folder ID is required');
  }
  
  if (DEMO_MODE && sampleGalleryImages[folderId]) {
    console.log('[DEMO] Returning sample gallery images for folder:', folderId);
    return sampleGalleryImages[folderId];
  }
  
  try {
    const drive = await getGoogleDriveClient();
    
    const response = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType contains 'image/') and trashed=false`,
      fields: 'files(id, name, thumbnailLink, webViewLink, webContentLink, description, createdTime)',
      pageSize: 100,
    });

    const files = response.data.files || [];

    return files.map(file => ({
      id: file.id!,
      name: file.name!,
      thumbnailLink: file.thumbnailLink || undefined,
      webViewLink: file.webViewLink || undefined,
      webContentLink: file.webContentLink || undefined,
      description: file.description || undefined,
      createdTime: file.createdTime || undefined,
      folder: folderId,
    }));
  } catch (error) {
    console.error('Error fetching gallery images from Google Drive:', error);
    if (DEMO_MODE && sampleGalleryImages[folderId]) {
      return sampleGalleryImages[folderId];
    }
    throw error;
  }
}
