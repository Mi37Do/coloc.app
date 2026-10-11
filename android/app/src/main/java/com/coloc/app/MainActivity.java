package com.coloc.app;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Draw under the status/navigation bars; @capacitor-community/safe-area fixes the insets
        EdgeToEdge.enable(this);
    }
}
