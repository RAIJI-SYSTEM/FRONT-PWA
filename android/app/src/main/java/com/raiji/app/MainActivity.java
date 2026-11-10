package com.raiji.app;

import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Sem o efeito de "esticar" do Android 12+ ao puxar a página além das bordas:
        // ele deformava o cabeçalho e o menu inferior junto com o conteúdo
        getBridge().getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
    }
}
