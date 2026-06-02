import AppLayout from './components/AppLayout';
import FileUploader from './components/FileUploader';

function App() {
  return (
    <FileUploader>
      <AppLayout />
    </FileUploader>
  );
}

export default App;
