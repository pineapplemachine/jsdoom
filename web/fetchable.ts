// Represents the status of a resource that can be loaded asynchronously
export enum FetchStatus {
    NotCached,
    Fetching,
    Failed,
    Cached,
}

// Represents a resource that can be loaded asynchronously
export abstract class Fetchable<T> {
    // Whether or not the fetch is currently in progress
    protected _fetchStatus: FetchStatus;
    // The resource URL
    public url: string;
    // Request settings
    protected init: RequestInit | undefined;
    // The cached response data
    protected _data: T | null;
    // Functions to call when the request finishes successfully
    public onComplete: ((data: T) => void)[];
    // Functions to call when the request fails
    public onError: ((error: any) => void)[];
    
    constructor(url: string, init?: RequestInit){
        this.url = url;
        this.init = init;
        this._data = null;
        this._fetchStatus = FetchStatus.NotCached;
        this.onComplete = [];
        this.onError = [];
    }
    
    public get data(): T | null {
        return this._data;
    }
    
    // Get the fetch status
    public get fetchStatus(): FetchStatus {
        return this._fetchStatus;
    }
    
    // Start the fetch. To consume the data, you need to add a callback to the
    // onComplete array. To handle errors, add a callback to the onError array.
    public fetch(maxAttempts: number = 0, url?: string, init?: RequestInit): null {
        // Fetch is in progress; callback will be called in the future.
        if(this._fetchStatus === FetchStatus.Fetching){
            return null;
        }
        // Cannot fetch a resource a negative number of times!
        if(maxAttempts < 0){
            return null;
        }
        // If the resource is already cached, return it immediately.
        if(this._fetchStatus === FetchStatus.Cached){
            this.onComplete.forEach((callback) => callback(this._data!));
            // Avoid calling the onComplete callbacks more than once.
            this.onComplete = [];
            return null;
        }
        // Set up the fetch.
        // Begin the fetch for the first time, or if the fetch fails.
        this._fetchStatus = FetchStatus.Fetching;
        // Set fetch URL.
        const fetchUrl = url === undefined ? this.url : url;
        this.url = fetchUrl;
        // This function performs the actual fetch. It is a closure so that it
        // can be called recursively, as well as use the maxAttempts variable.
        const performFetch = (url: string, init?: RequestInit) => {
            fetch(url, init).then((response) => {
                this.handleResponse(response);
            }).catch((error) => {
                // Try again until the attempt counter runs out.
                if(maxAttempts > 0){
                    maxAttempts--;
                    performFetch(url, init);
                }else{
                    // Fetch failed
                    this._fetchStatus = FetchStatus.Failed;
                    this.handleError(error);
                }
            });
        };
        performFetch(fetchUrl, init);
        return null;
    }
    
    // Function to call once the request is complete. Override this method in
    // any subclasses you create.
    protected handleResponse(response: Response){
    }
    
    // Function to call if the request fails
    protected handleError(error: any){
        this.onError.forEach((callback) => callback(error));
    }
}

export class FetchableString extends Fetchable<string | void> {
    protected handleResponse(response: Response) {
        // If the server didn't respond with an error code
        if(response.ok){
            response.text().then((data) => {
                this._fetchStatus = FetchStatus.Cached;
                // Cache response data
                this._data = data;
                this.onComplete.forEach((callback) => callback(data));
                // Avoid calling the onComplete callbacks more than once.
                this.onComplete = [];
            });
        }
    }
}
