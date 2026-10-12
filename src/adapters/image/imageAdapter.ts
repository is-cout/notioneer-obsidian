
import { hashCode } from "core/utils/hash";
import MakeMDPlugin from "main";
import { AFile } from "shared/types/afile";
import { FileTypeAdapter } from "core/middleware/filetypes";
import { FilesystemMiddleware } from "core/middleware/filesystem";
import { Platform } from "obsidian";
type ImageTypeCache = Record<never, never>


type ImageTypeContent = Record<never, never>
export class ImageFileTypeAdapter implements FileTypeAdapter<ImageTypeCache, ImageTypeContent> {
    public constructor (public plugin: MakeMDPlugin) {
        this.plugin = plugin;
    }
    public cacheDirectory = ".makemd/thumbnails";
    public supportedFileTypes = ["png", "jpg", "jpeg", "webp", "gif", "avif"];
    public id = 'images.make.md';
    public middleware: FilesystemMiddleware;
    public cache: Map<string, ImageTypeCache>;
    public initiate (middleware: FilesystemMiddleware) {
        this.middleware = middleware;
        this.cache = new Map();
    }
    public async generateThumbnail (file: AFile, thumbnail: string, size=256) {
        const binary = await this.middleware.readBinaryToFile(file.path);
            if (!binary) return false;
            const srcImage = new Image();
            srcImage.src = this.middleware.resourcePathForPath(file.path);
            const result = await new Promise((resolve, reject) => { srcImage.onload = () => resolve(true); srcImage.onerror = () => resolve(false) });
            if (!result) return false;
            const aspect_ratio = Math.max(size / srcImage.width, size / srcImage.height);
            // Plain canvas scaling instead of make.md's pica, whose inline WASM and
            // data-URL workers the community scanner flags.
            const resize = createEl("canvas");
            resize.width = aspect_ratio * srcImage.width;
            resize.height = aspect_ratio * srcImage.height;
            const ctx = resize.getContext('2d');
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(srcImage, 0, 0, resize.width, resize.height);
            const resizedBlob = await new Promise<Blob | null>((resolve) => resize.toBlob(resolve, 'image/jpeg', 0.8));
            if (!resizedBlob) return false;
            const resizedBinary = await resizedBlob.arrayBuffer();
            if (!(await this.middleware.fileExists(this.cacheDirectory))) {
                await this.middleware.createFolder(this.cacheDirectory);
            }
            await this.middleware.writeBinaryToFile(thumbnail, resizedBinary);
            return true;
}
public loadFile: (file: AFile) => Promise<void>;
    public async parseCache (file: AFile, refresh: boolean) {
        
        
        if (!file) return;
        const thumbnailPath = `${this.cacheDirectory}/${hashCode(file.path)}.${file.extension}`;
        let thumbnail = file.path
        if (this.plugin.superstate.settings.imageThumbnails) {
            if (!(await this.middleware.fileExists(thumbnailPath)))
            {
                if (!Platform.isMobile) {
                const thumbnailResult = await this.generateThumbnail(file, thumbnailPath);
                    if (thumbnailResult) {
                        thumbnail = thumbnailPath
                    }
                }
            } else {
                thumbnail = thumbnailPath
            }
        }
        const label = this.middleware.getFileCache(file.path)?.label
        const updatedCache = { 
            subtype: "image",
            label: {
            name: file.name,
            sticker: label?.sticker.length > 0 ? label.sticker : "ui//mk-make-image",
            color: label?.color,
            thumbnail: thumbnail,
            cover: thumbnail,
        },
        preview: {
            thumbnail: thumbnail,
        }
    }
        this.cache.set(file.path, updatedCache);
        this.middleware.updateFileCache(file.path, this.cache.get(file.path), refresh);
    }
    
    public cacheTypes (file: AFile) { return [] as Array<keyof ImageTypeCache>}
    public contentTypes (file: AFile) { return [] as Array<keyof ImageTypeContent>}
    
    public newFile: (path: string, type: string, parent: string, content?: any) => Promise<AFile>;

    public getCacheTypeByRefString: (file: AFile, refString: string) => any;
    public getCache: (file: AFile, fragmentType: keyof ImageTypeContent, query?: string) => never;
    public readContent: (file: AFile, fragmentType: keyof ImageTypeContent, fragmentId: any) => any
    public newContent: (file: AFile, fragmentType: keyof ImageTypeContent, name: string, content: ImageTypeContent[typeof fragmentType], options: {[key: string]: any}) => Promise<any>;
    public saveContent: (file: AFile, fragmentType: keyof ImageTypeContent, fragmentId: any, content: (prev: ImageTypeContent[typeof fragmentType]) => any) => Promise<boolean>;
    public deleteContent: (file: AFile, fragmentType: keyof ImageTypeContent, fragmentId: any) => void
    
}
