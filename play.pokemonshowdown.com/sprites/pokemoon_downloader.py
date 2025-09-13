import requests
import os
import threading
from tkinter import *
from tkinter import ttk, messagebox
from urllib.parse import urljoin
from bs4 import BeautifulSoup

class SpriteDownloader:
    def __init__(self, root):
        self.root = root
        self.root.title("Pokemon Sprite Downloader")
        self.root.geometry("600x1000")
        self.root.resizable(False, False)
        
        # Create main frame
        main_frame = Frame(self.root, padx=20, pady=20)
        main_frame.pack(fill=BOTH, expand=True)
        
        # Title
        title_label = Label(main_frame, text="Pokemon Showdown Sprite Downloader", 
                           font=("Arial", 16, "bold"))
        title_label.pack(pady=(0, 20))
        
        # Description
        desc_label = Label(main_frame, text="Select the sprite folders you want to download:", 
                          font=("Arial", 10))
        desc_label.pack(anchor=W, pady=(0, 10))
        
        # Available sprite folders
        self.folders = [
    "afd", "afd-back", "afd-back-shiny", "afd-shiny",
    "ani", "ani-back", "ani-back-shiny", "ani-shiny",
    "bwicons", "categories",
    "dex", "dex-shiny",
    "digimon", "digimon-backup-2021-11-22",
    "gen1", "gen1-back", "gen1rb", "gen1rg", "gen1rgb-back",
    "gen2", "gen2-back", "gen2-back-shiny", "gen2-shiny", "gen2g", "gen2s",
    "gen3", "gen3-2", "gen3-back", "gen3-back-shiny", "gen3-shiny",
    "gen3frlg", "gen3rs", "gen3rs-shiny",
    "gen4", "gen4-back", "gen4-back-shiny", "gen4-shiny",
    "gen4dp", "gen4dp-2", "gen4dp-2-shiny", "gen4dp-shiny",
    "gen6", "gen6-back", "gen6bgs",
    "home", "home-centered", "home-centered-shiny", "home-shiny",
    "substitutes"
]

        
        # Create checkboxes for each folder
        self.selected_folders = {}
        folder_frame = Frame(main_frame)
        folder_frame.pack(fill=BOTH, expand=True, pady=(0, 20))
        
        for i, folder in enumerate(self.folders):
            var = BooleanVar(value=True)  # All selected by default
            cb = Checkbutton(folder_frame, text=folder, variable=var, 
                            font=("Arial", 10))
            cb.grid(row=i//3, column=i%3, sticky=W, padx=5, pady=2)
            self.selected_folders[folder] = var
        
        # Download location
        location_frame = Frame(main_frame)
        location_frame.pack(fill=X, pady=(0, 20))
        
        Label(location_frame, text="Download to:", font=("Arial", 10)).pack(anchor=W)
        
        self.location_var = StringVar(value=os.path.join(os.path.expanduser("~"), "PokemonSprites"))
        location_entry = Entry(location_frame, textvariable=self.location_var, font=("Arial", 10))
        location_entry.pack(fill=X, pady=(5, 0))
        
        # Progress bar
        self.progress = ttk.Progressbar(main_frame, mode='determinate')
        self.progress.pack(fill=X, pady=(0, 10))
        
        # Status label
        self.status_var = StringVar(value="Ready to download")
        status_label = Label(main_frame, textvariable=self.status_var, 
                            font=("Arial", 9), foreground="gray")
        status_label.pack(anchor=W)
        
        # Button frame
        button_frame = Frame(main_frame)
        button_frame.pack(fill=X)
        
        self.download_btn = Button(button_frame, text="Download Selected", 
                                  command=self.start_download, font=("Arial", 12, "bold"),
                                  bg="#4CAF50", fg="white", padx=20, pady=10)
        self.download_btn.pack(pady=(10, 0))
        
        # Set up the downloader
        self.stop_download = False
        
    def start_download(self):
        # Get selected folders
        to_download = [folder for folder, var in self.selected_folders.items() if var.get()]
        
        if not to_download:
            messagebox.showwarning("Selection Error", "Please select at least one folder to download.")
            return
            
        # Create download directory if it doesn't exist
        download_path = self.location_var.get()
        if not os.path.exists(download_path):
            os.makedirs(download_path)
            
        # Disable download button during download
        self.download_btn.config(state=DISABLED, text="Downloading...")
        self.stop_download = False
        
        # Start download in a separate thread
        thread = threading.Thread(target=self.download_folders, args=(to_download, download_path))
        thread.daemon = True
        thread.start()
        
    def download_folders(self, folders, download_path):
        base_url = "https://play.pokemonshowdown.com/sprites/"
        total_folders = len(folders)
        
        for i, folder in enumerate(folders):
            if self.stop_download:
                break
                
            folder_url = urljoin(base_url, folder + "/")
            folder_path = os.path.join(download_path, folder)
            
            if not os.path.exists(folder_path):
                os.makedirs(folder_path)
                
            # Update status
            self.status_var.set(f"Downloading {folder}...")
            self.progress['value'] = (i / total_folders) * 100
            self.root.update_idletasks()
            
            try:
                # Get list of files in the folder
                response = requests.get(folder_url)
                if response.status_code != 200:
                    self.status_var.set(f"Failed to access {folder_url}")
                    continue
                    
                soup = BeautifulSoup(response.text, 'html.parser')
                files = []
                
                # Find all links that point to image files
                for link in soup.find_all('a'):
                    href = link.get('href')
                    if href and not href.startswith('../') and not href.endswith('/'):
                        # Check if it's an image file
                        if any(href.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif']):
                            files.append(href)
                
                total_files = len(files)
                
                for j, file in enumerate(files):
                    if self.stop_download:
                        break
                        
                    file_url = urljoin(folder_url, file)
                    file_path = os.path.join(folder_path, file)
                    
                    # Update status for individual files
                    self.status_var.set(f"Downloading {folder}: {file} ({j+1}/{total_files})")
                    self.root.update_idletasks()
                    
                    # Download the file if it doesn't exist
                    if not os.path.exists(file_path):
                        try:
                            file_response = requests.get(file_url, stream=True)
                            if file_response.status_code == 200:
                                with open(file_path, 'wb') as f:
                                    for chunk in file_response.iter_content(1024):
                                        f.write(chunk)
                        except Exception as e:
                            print(f"Error downloading {file_url}: {e}")
            
            except Exception as e:
                self.status_var.set(f"Error processing {folder}: {str(e)}")
                
        # Update UI when done
        self.status_var.set("Download completed!" if not self.stop_download else "Download cancelled!")
        self.progress['value'] = 100
        self.download_btn.config(state=NORMAL, text="Download Selected")
        self.root.update_idletasks()

if __name__ == "__main__":
    root = Tk()
    app = SpriteDownloader(root)
    root.mainloop()